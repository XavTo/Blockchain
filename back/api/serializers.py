# api/serializers.py

from rest_framework import serializers
from .models import Asset, Trade

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'

class TradeSerializer(serializers.ModelSerializer):
    asset = AssetSerializer(read_only=True)

    class Meta:
        model = Trade
        fields = '__all__'
