# api/views.py

from rest_framework import viewsets
from .models import Asset, Trade
from .serializers import AssetSerializer, TradeSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib import auth
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

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
def login(request):
    username = request.POST["username"]
    password = request.POST["password"]
    user = auth.authenticate(request, username=username, password=password)
    if user is not None:
        auth.login(request, user)
        return Response(status=200)
    else:
        return Response(status=401)

@api_view(['POST'])
def register(request):
    username = request.POST["username"]
    password = request.POST["password"]
    user = User.objects.create_user(username=username, password=password)
    if user is not None:
        auth.login(request, user)
        return Response(status=200)
    else:
        return Response(status=401)
