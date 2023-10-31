import sdk from "symbol-sdk";
import SymbolFacade from "symbol-sdk/ts/src/facade/SymbolFacade";
import { Network } from "symbol-sdk/ts/src/symbol/Network";
import type { SSSWindow } from "sss-module";
import { Transaction } from "symbol-sdk/ts/src/symbol/models";

declare const window: SSSWindow;

const MAINNODE = "https://xym748.allnodes.me:3001";           // MAINNET
const TESTNODE = "https://vmi831828.contaboserver.net:3001";  // TESTNET

// ネットワークタイプ
const NetTypeEnum = {
  Main : 104,
  Test : 152,
};

document.getElementById('buttonSignSSS')!.addEventListener('click', signSSS);
document.getElementById('buttonSignAlice')!.addEventListener('click', signAlice);

async function signSSS() {
  sign(true);
}

async function signAlice() {
  sign(false);
}

async function sign(b : boolean) {
  if (b && ("undefined" === typeof window.SSS)) {
    return;
  }

  document.getElementById('buttonSignSSS')!.setAttribute("disabled", "true");
  document.getElementById('buttonSignAlice')!.setAttribute("disabled", "true");

  const networkType = Number(((document.getElementById('inputNetType')!) as HTMLInputElement).value)
  const address = ((document.getElementById('inputAddress')!) as HTMLInputElement).value;

  const netType = NetTypeEnum.Main == networkType ? sdk.symbol.Network.MAINNET : sdk.symbol.Network.TESTNET;
  const facade = new sdk.facade.SymbolFacade(netType);
  const pubKey = await getPublicKey(netType, address);
  const tx = createTx(facade, address, pubKey);

  b ? await announceSSS(netType, tx) : await wakeupAlice(networkType, tx, pubKey);

  document.getElementById('buttonSignSSS')!.removeAttribute("disabled");
  document.getElementById('buttonSignAlice')!.removeAttribute("disabled");
}

async function announceSSS(netType: Network, tx: Transaction) {
  if ("undefined" === typeof window.SSS) {
    return;
  }

  window.SSS.setTransactionByPayload(sdk.utils.uint8ToHex(tx.serialize()));
  window.SSS.requestSign()
  .then((ret) =>{
    announceTx(netType, ret.payload);
  });
}

async function wakeupAlice(networkType: Number, tx: Transaction, pubKey: string) {

  const url = location.origin + location.pathname + "?networkType=" + networkType;

  const query = new URLSearchParams({
    "type": "request_sign_transaction",
    "data": sdk.utils.uint8ToHex(tx.serialize()),
    "method": "get",
    "callback": sdk.utils.uint8ToHex((new TextEncoder()).encode(url)),
    "set_public_key": pubKey,
  });

  location.href = "alice://sign?" + query.toString()
}

async function announceAlice(netType: Network, tx: Transaction, pubKey: string) {
  // TODO
  // window.SSS.setTransactionByPayload(sdk.utils.uint8ToHex(tx.serialize()));
  // window.SSS.requestSign()
  // .then((ret) =>{
  //   announceTx(netType, ret.payload);
  // });
}

function createTx(facade: SymbolFacade, address: string, pubKey: string) {
  const tx = facade.transactionFactory.create({
    type: "transfer_transaction_v1",
    signerPublicKey: pubKey,
    deadline: facade.network.fromDatetime(new Date(Date.now())).addHours(2).timestamp,
    recipientAddress: address,
    mosaics: [],
    message: new Uint8Array([0x00,...(new TextEncoder()).encode('Hello, Symbol!')]),
  });
  tx.fee = new sdk.symbol.Amount(BigInt(tx.size * 100)); //手数料
  return tx;
}

async function getPublicKey(netType: Network, address: string) {
  const node = sdk.symbol.Network.MAINNET == netType ? MAINNODE : TESTNODE;
  return fetch(
    new URL('/accounts/' + address, node),
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  )
  .then((res) => res.json())
  .then((json) => {
    return json.account.publicKey;
  });
}

async function announceTx(netType: Network, payload: string) {
  const node = sdk.symbol.Network.MAINNET == netType ? MAINNODE : TESTNODE;
  return fetch(
    new URL('/transactions', node),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"payload": payload}),
    }
  )
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
}
