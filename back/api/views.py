# api/views.py

from rest_framework import viewsets
from .models import Asset, Trade, Wallet
from .serializers import AssetSerializer, TradeSerializer
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    # Vérification du token JWT via la classe d'authentification
    auth = JWTAuthentication()
    user, token = auth.authenticate(request)

    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    # Données simulées
    data = {
        "totalAssets": 120,
        "assetsForSale": 45,
        "assetsExchanged": 75,
    }

    return Response(data)

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
