# api/models.py

from django.db import models
from django.contrib.auth.models import User

class Asset(models.Model):
    name = models.CharField(max_length=100)
    image = models.URLField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name

class Trade(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity} x {self.asset.name}"

class Wallet(models.Model):
    address = models.CharField(max_length=100)
    public_key = models.CharField(max_length=100)
    private_key = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
