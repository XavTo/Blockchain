# api/views.py

from rest_framework import viewsets
from .models import Asset, Trade
from .serializers import AssetSerializer, TradeSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response

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
