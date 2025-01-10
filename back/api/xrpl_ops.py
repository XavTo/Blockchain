import xrpl
import requests
import logging
from .serializers import SellOfferSerializer
from .models import SellOffer, User, Wallet

logger = logging.getLogger(__name__)

testnet_url = "https://s.altnet.rippletest.net:51234/"

def create_new_wallet() -> xrpl.wallet.Wallet:
    client = xrpl.clients.JsonRpcClient(testnet_url)

    new_wallet = xrpl.wallet.generate_faucet_wallet(client)

    return new_wallet

def mint_new_nft(wallet: xrpl.wallet.Wallet, uri: str):
    client = xrpl.clients.JsonRpcClient(testnet_url)

    nft_mint = xrpl.models.transactions.NFTokenMint(
        account=wallet.address,
        uri=xrpl.utils.str_to_hex(uri),
        flags=int(8),
        transfer_fee=int(0),
        nftoken_taxon=int(0)
    )
    reply=""
    try:
        response=xrpl.transaction.submit_and_wait(nft_mint, client, wallet)
        reply=response.result
    except xrpl.transaction.XRPLReliableSubmissionException as e:
        reply=f"Submit failed: {e}"
    return reply

def list_nfts(wallet: xrpl.wallet.Wallet):
    data = {}
    data["method"] = "account_nfts"
    params = {}
    params["account"] = str(wallet.address)
    params["ledger_index"] = "current"
    params["queue"] = True
    data["params"] = [params]
    r = requests.post(testnet_url, json=data)

    return r.json()

def create_sell_offer(wallet: xrpl.wallet.Wallet, nftoken_id: str, amount: str, destination: str = None) -> dict:
    """
    Crée une Sell Offer sur XRPL.
    """
    client = xrpl.clients.JsonRpcClient(testnet_url)

    create_offer_tx = xrpl.models.transactions.NFTokenCreateOffer(
        account=wallet.address,
        nftoken_id=nftoken_id,
        amount=amount,  # "0" pour gratuit
        flags=1,        # tfSellNFToken
        destination=destination  # adresse du destinataire (optionnel)
    )

    try:
        response = xrpl.transaction.submit_and_wait(create_offer_tx, client, wallet)
        if response.is_successful():
            # Extraire l'OfferIndex depuis la réponse
            meta = response.result.get("meta", {})
            affected_nodes = meta.get("AffectedNodes", [])
            offer_index = None
            for node in affected_nodes:
                created = node.get("CreatedNode")
                if created and created.get("LedgerEntryType") == "NFTokenOffer":
                    offer_index = created.get("LedgerIndex")
                    break
            if not offer_index:
                raise Exception("Impossible de récupérer l'OfferIndex.")
            return {
                "offer_index": offer_index,
                "transaction_hash": response.result.get("hash")
            }
        else:
            raise Exception(response.result.get("engine_result_message", "Erreur inconnue lors de la création de l'offre."))
    except xrpl.transaction.XRPLReliableSubmissionException as e:
        raise Exception(f"CreateSellOffer failed: {e}")

def accept_sell_offer(wallet: xrpl.wallet.Wallet, offer_index: str) -> dict:
    """
    Accepte une Sell Offer sur XRPL.
    """
    client = xrpl.clients.JsonRpcClient(testnet_url)

    accept_offer_tx = xrpl.models.transactions.NFTokenAcceptOffer(
        account=wallet.address,
        nftoken_offers=[offer_index]
    )

    try:
        response = xrpl.transaction.submit_and_wait(accept_offer_tx, client, wallet)
        if response.is_successful():
            return {
                "transaction_hash": response.result.get("hash")
            }
        else:
            raise Exception(response.result.get("engine_result_message", "Erreur inconnue lors de l'acceptation de l'offre."))
    except xrpl.transaction.XRPLReliableSubmissionException as e:
        raise Exception(f"AcceptSellOffer failed: {e}")

def cancel_sell_offer(wallet: xrpl.wallet.Wallet, offer_index: str) -> dict:
    """
    Annule une Sell Offer sur XRPL.
    """
    client = xrpl.clients.JsonRpcClient(testnet_url)

    cancel_offer_tx = xrpl.models.transactions.NFTokenCancelOffer(
        account=wallet.address,
        nftoken_offers=[offer_index]
    )

    try:
        response = xrpl.transaction.submit_and_wait(cancel_offer_tx, client, wallet)
        if response.is_successful():
            return {
                "transaction_hash": response.result.get("hash")
            }
        else:
            raise Exception(response.result.get("engine_result_message", "Erreur inconnue lors de l'annulation de l'offre."))
    except xrpl.transaction.XRPLReliableSubmissionException as e:
        raise Exception(f"CancelSellOffer failed: {e}")

def list_sell_offers_for_user(wallet: xrpl.wallet.Wallet) -> list:
    """
    Liste toutes les Sell Offers destinées à l'utilisateur (avec destination = wallet.address).
    """
    data = {
        "method": "account_offers",
        "params": [
            {
                "account": str(wallet.address),
                "ledger_index": "current"
            }
        ]
    }

    response = requests.post(testnet_url, json=data)
    xrpl_response = response.json()

    # Récupérer toutes les Sell Offers où destination == wallet.address
    sell_offers = []
    if xrpl_response.get("result") and xrpl_response["result"].get("offers"):
        for offer in xrpl_response["result"]["offers"]:
            if offer.get("NFTokenID") and offer.get("Destination") == str(wallet.address):
                sell_offers.append(offer)

    return sell_offers

def list_all_sell_offers() -> list:
    """
    Liste toutes les Sell Offers disponibles sur le marketplace.
    Note : XRPL ne fournit pas de méthode directe pour lister toutes les Sell Offers.
    Cette fonction suppose que vous maintenez une base de données des Sell Offers.
    """
    # Ici, vous devriez interroger votre base de données pour récupérer toutes les Sell Offers actives.
    # Cette implémentation dépend de votre modèle de données et n'est pas directement liée à XRPL.
    # Exemple :
    active_offers = SellOffer.objects.filter(status='active')
    serializer = SellOfferSerializer(active_offers, many=True)
    return serializer.data

def wallet_from_user(user: User) -> xrpl.wallet.Wallet:
    """
    Récupère le portefeuille XRPL associé à l'utilisateur.
    """
    db_wallet = Wallet.objects.filter(user=user).first()
    if not db_wallet:
        raise Exception("Wallet not found for user.")
    wallet = xrpl.wallet.Wallet(
        public_key=db_wallet.public_key,
        private_key=db_wallet.private_key,
        master_address=db_wallet.address
    )
    return wallet
