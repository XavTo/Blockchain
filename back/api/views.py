# api/views.py

from rest_framework import viewsets, status
from .models import Asset, Trade, Wallet, SellOffer
from .serializers import AssetSerializer, TradeSerializer, SellOfferSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib import auth
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .serializers import RegisterSerializer
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import authenticate
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .xrpl_ops import create_new_wallet, mint_new_nft, list_nfts
import xrpl
from .xrpl_ops import (
    create_sell_offer as xrpl_create_sell_offer,
    accept_sell_offer as xrpl_accept_sell_offer,
    cancel_sell_offer as xrpl_cancel_sell_offer,
    list_sell_offers_for_user as xrpl_list_sell_offers_for_user,
    list_all_sell_offers as xrpl_list_all_sell_offers
)
from .xrpl_ops import wallet_from_user
import logging


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

class TradeViewSet(viewsets.ModelViewSet):
    queryset = Trade.objects.all()
    serializer_class = TradeSerializer

@api_view(['POST'])
def execute_trade(request):
    asset_id = request.data.get('asset_id')
    quantity = request.data.get('quantity')
    try:
        asset = Asset.objects.get(id=asset_id)
        Trade.objects.create(asset=asset, quantity=quantity)
        return Response({"message": f"Échange de {quantity} {asset.name} réussi !"})
    except Asset.DoesNotExist:
        return Response({"error": "L'actif sélectionné n'existe pas."}, status=404)

@api_view(['POST'])
def logout(request):
    auth.logout(request)
    return Response(status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()        
        # Create wallet
        wallet = create_new_wallet()
        db_wallet = Wallet(address=wallet.address, public_key=wallet.public_key,
                            private_key=wallet.private_key, user=user)
        db_wallet.save()
        
        # Génération du token JWT pour l'utilisateur inscrit
        token = AccessToken.for_user(user)
        return Response({
            "message": "Inscription réussie.",
            "token": str(token),
        })
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        # Génération du token JWT pour l'utilisateur authentifié
        token = AccessToken.for_user(user)
        return Response({
            "username": username,
            "jwt": str(token),
        })
    return Response({"error": "Identifiants invalides."}, status=401)

def wallet_from_user(user: User) -> xrpl.wallet.Wallet:    
    db_wallet = Wallet.objects.filter(user=user.id).first()
    wallet = xrpl.wallet.Wallet(public_key=db_wallet.public_key,
                                private_key=db_wallet.private_key,
                                master_address=db_wallet.address)
    return wallet

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_asset(request):
    auth = JWTAuthentication()
    user, token = auth.authenticate(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    
    wallet = wallet_from_user(user)

    uri = request.data.get("URI")
    result = mint_new_nft(wallet, uri)

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_assets(request):
    auth = JWTAuthentication()
    user, token = auth.authenticate(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    wallet = wallet_from_user(user)

    result = list_nfts(wallet)
    return Response(status=200, data=result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wallet_info(request):
    """
    Récupère les informations du portefeuille de l'utilisateur authentifié.
    """
    user = request.user
    try:
        db_wallet = Wallet.objects.get(user=user)
        wallet_data = {
            "address": db_wallet.address,
            "public_key": db_wallet.public_key,
        }
        return Response(wallet_data, status=status.HTTP_200_OK)
    except Wallet.DoesNotExist:
        return Response({"error": "Portefeuille non trouvé."}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_sell_offer_view(request):
    """
    Crée une Sell Offer pour un NFT.
    """
    auth = JWTAuthentication()
    user, token = auth.authenticate(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    nft_id = request.data.get("nft_id")
    amount = request.data.get("amount")  # en drops, string or int
    destination = request.data.get("destination", None)  # adresse XRPL (optionnel)

    if not nft_id or amount is None:
        return Response({"error": "Missing parameters: nft_id, amount"}, status=400)

    wallet = wallet_from_user(user)

    try:
        xrpl_result = xrpl_create_sell_offer(wallet, nft_id, amount, destination)
        offer_index = xrpl_result.get("offer_index")
        if not offer_index:
            raise Exception("Failed to retrieve offer_index from XRPL response.")

        # Enregistrer l'offre dans la base de données
        sell_offer = SellOffer.objects.create(
            nftoken_id=nft_id,
            seller=user,
            amount=amount,
            destination=destination,
            offer_index=offer_index,
            status='active'
        )

        serializer = SellOfferSerializer(sell_offer)
        return Response({"message": "Sell offer créée avec succès.", "offer": serializer.data}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sell_offers_for_user_view(request):
    """
    Liste toutes les Sell Offers destinées à l'utilisateur.
    """
    auth = JWTAuthentication()
    user, token = auth.authenticate(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    wallet = wallet_from_user(user)

    try:
        xrpl_sell_offers = xrpl_list_sell_offers_for_user(wallet)
        return Response({"sell_offers": xrpl_sell_offers}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_all_sell_offers_view(request):
    """
    Liste toutes les Sell Offers disponibles sur le marketplace.
    """
    try:
        sell_offers = xrpl_list_all_sell_offers()
        return Response({"sell_offers": sell_offers}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_sell_offer_view(request):
    """
    Accepte une Sell Offer.
    """
    auth = JWTAuthentication()
    user, token = auth.authenticate(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    offer_index = request.data.get("offer_index")

    if not offer_index:
        return Response({"error": "Missing parameter: offer_index"}, status=400)

    wallet = wallet_from_user(user)

    try:
        xrpl_result = xrpl_accept_sell_offer(wallet, offer_index)

        # Mettre à jour le statut de l'offre dans la base de données
        try:
            sell_offer = SellOffer.objects.get(offer_index=offer_index, status='active')
            sell_offer.status = 'accepted'
            sell_offer.save()
        except SellOffer.DoesNotExist:
            pass  # Optionnel : gérer le cas où l'offre n'est pas trouvée

        return Response({"message": "Sell offer acceptée avec succès.", "result": xrpl_result}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_sell_offer_view(request):
    """
    Annule une Sell Offer créée par l'utilisateur.
    """
    auth = JWTAuthentication()
    user, token = auth.authenticate(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    offer_index = request.data.get("offer_index")

    if not offer_index:
        return Response({"error": "Missing parameter: offer_index"}, status=400)

    # Vérifier que l'offre appartient à l'utilisateur et est active
    try:
        sell_offer = SellOffer.objects.get(offer_index=offer_index, seller=user, status='active')
    except SellOffer.DoesNotExist:
        return Response({"error": "Sell offer not found or already processed."}, status=404)

    wallet = wallet_from_user(user)

    try:
        xrpl_result = xrpl_cancel_sell_offer(wallet, offer_index)

        # Supprimer l'offre de la base de données
        sell_offer.delete()

        return Response({"message": "Sell offer annulée avec succès.", "result": xrpl_result}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

