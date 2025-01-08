import xrpl

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