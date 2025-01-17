import xrpl
import requests
import logging
from .serializers import SellOfferSerializer
from .models import SellOffer, User, Wallet
import json
from xrpl.wallet import Wallet
from xrpl.clients import JsonRpcClient
from xrpl.transaction import submit_and_wait
from xrpl.models.transactions import Payment
from xrpl.utils import xrp_to_drops
from xrpl.wallet import Wallet
from xrpl.models.requests import AccountInfo
from xrpl.models.requests import NFTSellOffers

logger = logging.getLogger(__name__)

testnet_url = "https://s.altnet.rippletest.net:51234/"


def fund_wallet(master_wallet_secret: str, destination_address: str, amount_xrp: float, client: JsonRpcClient):
    """
    Envoie des XRP du wallet maître vers le wallet de destination.

    :param master_wallet_secret: Secret du wallet maître.
    :param destination_address: Adresse du wallet destinataire.
    :param amount_xrp: Montant en XRP à envoyer.
    :param client: Instance de JsonRpcClient connectée au Testnet.
    :return: Résultat de la transaction XRPL.
    """
    try:
        # Créer le wallet maître
        master_wallet = Wallet.from_seed(master_wallet_secret)
        
        # Créer la transaction de paiement
        payment = Payment(
            account=master_wallet.classic_address,
            amount=str(xrp_to_drops(amount_xrp)),
            destination=destination_address
        )
        
        # Soumettre la transaction et attendre la validation
        response = submit_and_wait(payment, client, master_wallet)
        
        # Vérifier le statut de la transaction
        if response.status == "success":
            return response.result  # Retourner directement le résultat
        else:
            raise Exception(f"Transaction échouée : {response.result.get('engine_result_message', 'Erreur inconnue')}")
    except Exception as e:
        raise Exception(f"Erreur lors de l'envoi des fonds : {e}")

    
def get_balance(address: str) -> int:
    """
    Récupère le solde en drops d'un compte.

    :param address: Adresse du compte XRPL.
    :return: Solde en drops.
    """
    try:
        # Initialiser le client
        client = JsonRpcClient(testnet_url)
        
        # Construire la requête AccountInfo
        account_info_request = AccountInfo(
            account=address,
            ledger_index="validated",
            strict=True
        )
        
        # Effectuer la requête
        response = client.request(account_info_request)
        
        # Vérifier le succès de la requête
        if response.status == "success":
            balance = int(response.result['account_data']['Balance'])
            return balance
        else:
            raise Exception(f"Échec de la récupération du solde : {response.result}")
    except Exception as e:
        raise Exception(f"Erreur lors de la récupération du solde : {e}")
    
def xrp_to_drops(xrp: float) -> int:
    return int(xrp * 1_000_000)

def get_sell_offer_details(offer_index: str) -> dict:
    """
    Récupère les détails d'une offre de vente (NFTokenSellOffer) à partir de la blockchain.
    """
    client = xrpl.clients.JsonRpcClient(testnet_url)

    request = NFTSellOffers(nft_id=offer_index)
    response = client.request(request)

    if response.status == "success":
        offers = response.result.get("offers", [])

        for offer in offers:
            return offer  # on suppose qu'il n'y a qu'une seule offre
    else:
        raise Exception(f"Impossible de récupérer l'offre : {response.result}")

    return {}

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

def parseXrplNfts(xrplData: any) -> list:
    account_nfts = xrplData.get("result", {}).get("account_nfts", [])

    parsed_nfts = []
    for nft in account_nfts:
        # Ensure consistent casing
        nftId = nft.get("NFTokenID", "").upper()
        hexUri = nft.get("URI", "")
        decodedUri = bytes.fromhex(hexUri).decode('utf-8', errors='replace')

        name = "NFT sans nom"
        description = ""
        imageUrl = ""
        try:
            jsonUri = json.loads(decodedUri)
            name = jsonUri.get("name", name)
            description = jsonUri.get("description", "")
            imageUrl = jsonUri.get("image", "")
        except json.JSONDecodeError:
            # If not JSON, fallback to using the raw decoded URI as the "name"
            name = decodedUri or name

        parsed_nfts.append({
            "id": nftId,
            "name": name,
            "description": description,
            "URI": imageUrl,
        })

    return parsed_nfts


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
    Accepte une offre de vente NFT sur XRPL.
    Vérifie d'abord que l'acheteur dispose des fonds nécessaires.
    """
    try:
        client = xrpl.clients.JsonRpcClient(testnet_url)
        offer_details = get_sell_offer_details(offer_index)
        required_drops = int(offer_details.get("amount", 0))

        if required_drops == 0:
            raise Exception("Impossible de déterminer le prix de l'offre.")

        buyer_balance_drops = get_balance(wallet.classic_address)

        # 3. Ajouter une marge pour les frais éventuels
        # Sur XRPL, chaque transaction coûte un "transaction fee" minime
        # (environ 10 drops à 500 drops selon la congestion)
        # On peut donc prévoir un petit buffer, par exemple 1000 drops
        fee_buffer = 1000  
        
        if buyer_balance_drops < (required_drops + fee_buffer):
            raise Exception("Fonds insuffisants pour accepter cette offre.")

        accept_offer_txn = xrpl.models.transactions.NFTokenAcceptOffer(
            account=wallet.classic_address,
            nftoken_sell_offer=offer_index,  # l'ID de l'offre
        )

        response = xrpl.transaction.submit_and_wait(
            accept_offer_txn,
            client,
            wallet,
        )
        
        if not response.is_successful():
            raise Exception(f"Transaction échouée : {response.result.get('engine_result_message', 'Erreur inconnue')}")

        return response.result

    except Exception as e:
        raise Exception(f"Erreur lors de l'acceptation de l'offre : {str(e)}")


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
    Liste toutes les Sell Offers où le wallet spécifié est la destination.
    """
    client = xrpl.clients.JsonRpcClient(testnet_url)

    # Étape 1 : Récupérer tous les NFTs liés au wallet
    account_nfts_request = {
        "method": "account_nfts",
        "params": [
            {
                "account": wallet.address,
                "ledger_index": "current"
            }
        ]
    }
    account_nfts_response = requests.post(testnet_url, json=account_nfts_request)
    account_nfts_data = account_nfts_response.json()

    if not account_nfts_data.get("result") or not account_nfts_data["result"].get("account_nfts"):
        return []

    # Étape 2 : Parcourir chaque NFT et récupérer les offres actives
    nft_ids = [nft["NFTokenID"] for nft in account_nfts_data["result"]["account_nfts"]]
    sell_offers = []

    for nft_id in nft_ids:
        nft_sell_offers_request = {
            "method": "nft_sell_offers",
            "params": [
                {
                    "nft_id": nft_id
                }
            ]
        }
        try:
            nft_sell_offers_response = requests.post(testnet_url, json=nft_sell_offers_request)
            nft_sell_offers_data = nft_sell_offers_response.json()

            if nft_sell_offers_data.get("result") and nft_sell_offers_data["result"].get("offers"):
                # Filtrer les offres où la destination est le wallet
                for offer in nft_sell_offers_data["result"]["offers"]:
                    if offer.get("Destination") == wallet.address:
                        sell_offers.append({
                            "nftoken_id": nft_id,
                            "offer_index": offer["index"],
                            "amount": offer["amount"],
                            "seller": offer["owner"],
                            "destination": offer["Destination"]
                        })
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des offres pour NFT {nft_id}: {e}")

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
