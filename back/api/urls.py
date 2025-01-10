# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, TradeViewSet, execute_trade, register, login, logout, create_asset, list_assets, get_wallet_info, create_sell_offer_view, list_sell_offers_for_user_view, list_all_sell_offers_view, accept_sell_offer_view, cancel_sell_offer_view
router = DefaultRouter()
router.register(r'assets', AssetViewSet)
router.register(r'trades', TradeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('execute-trade/', execute_trade, name='execute-trade'),
    path('register/', register, name="register"),
    path('login/', login, name="login"),
    path('logout/', logout, name="logout"),
    path('asset/', create_asset, name="create-asset"),
    path('list/', list_assets, name="list-assets"),
    path('wallet/', get_wallet_info, name='get_wallet_info'),

    path('create_sell_offer/', create_sell_offer_view, name='create-sell-offer'),
    path('sell_offers_for_me/', list_sell_offers_for_user_view, name='sell-offers-for-me'),
    path('all_sell_offers/', list_all_sell_offers_view, name='all-sell-offers'),
    path('accept_sell_offer/', accept_sell_offer_view, name='accept-sell-offer'),
    path('cancel_sell_offer/', cancel_sell_offer_view, name='cancel-sell-offer'),
]
