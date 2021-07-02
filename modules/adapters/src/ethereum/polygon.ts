import { Interface } from "@ethersproject/abi";
import { AddressZero } from "@ethersproject/constants";
import { formatUnits } from "@ethersproject/units";
import {
  AddressBook,
  TransferCategories,
  AddressCategories,
  EthTransaction,
  Logger,
  Transaction,
} from "@valuemachine/types";
import {
  setAddressCategory,
  parseEvent,
  rmDups,
} from "@valuemachine/utils";

import { Assets } from "../assets";

const { MATIC, ETH, WETH } = Assets;

export const polygonSource = "Polygon";

const ZapperMaticBridge = "ZapperMaticBridge";

export const govAddresses = [
  { name: MATIC, address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0" },
].map(setAddressCategory(AddressCategories.ERC20));

export const bridgeAddresses = [
  { name: "PolygonPlasmaBridge", address: "0x401F6c983eA34274ec46f84D70b31C151321188b" },
  { name: ZapperMaticBridge, address: "0xe34b087bf3c99e664316a15b01e5295eb3512760" },
].map(setAddressCategory(AddressCategories.Defi));

export const miscAddresses = [
  { name: "FlashWallet", address: "0x22F9dCF4647084d6C31b2765F6910cd85C178C18" },
  { name: "ZeroEx", address: "0xDef1C0ded9bec7F1a1670819833240f027b25EfF" },
  { name: "PolygonStateSyncer", address: "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE" },
].map(setAddressCategory(AddressCategories.Defi));

export const polygonAddresses = [
  ...govAddresses,
  ...bridgeAddresses,
  ...miscAddresses,
];

const plasmaBridgeInterface = new Interface([
  "event NewDepositBlock(address indexed owner, address indexed token, uint256 amountOrNFTId, uint256 depositBlockId)",
  "event MaxErc20DepositUpdate(uint256 indexed oldLimit, uint256 indexed newLimit)",
  "event ProxyUpdated(address indexed _new, address indexed _old)",
  "event OwnerUpdate(address _prevOwner, address _newOwner)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
]);

const wethInterface = new Interface([
  "event Approval(address indexed from, address indexed to, uint amount)",
  "event Deposit(address indexed from, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
  "event Withdrawal(address indexed to, uint256 amount)",
]);


export const polygonParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: polygonSource });
  const { getName, isToken, getDecimals } = addressBook;
  log.info(`Let's parse ${polygonSource}`);

  if (getName(ethTx.to) === ZapperMaticBridge) {
    const account = ethTx.from;
    tx.sources = rmDups([polygonSource, ...tx.sources]);
    tx.method = `Zap to Matic`;
    log.info(`Parsing ${tx.method}`);

    // Get all erc20 transfers even non-self
    const erc20Transfers = ethTx.logs.filter(txLog => isToken(txLog.address)).map(txLog => {
      const address = txLog.address;
      const event = parseEvent(wethInterface, txLog);
      if (event.name === "Transfer") {
        return {
          asset: getName(address),
          category: TransferCategories.Unknown,
          from: event.args.from === AddressZero ? address : event.args.from,
          index: txLog.index,
          quantity: formatUnits(event.args.amount, getDecimals(address)),
          to: event.args.to === AddressZero ? address : event.args.to,
        };
      } else if (event.name === "Deposit") {
        const swapOut = tx.transfers.find(transfer =>
          transfer.quantity === formatUnits(event.args.amount, 18)
          && transfer.asset === ETH
        );
        if (swapOut) {
          swapOut.category = TransferCategories.SwapOut;
          swapOut.to = WETH;
        }
        log.info(`Returning weth swapin`);
        return {
          asset: WETH,
          category: TransferCategories.SwapIn,
          from: WETH,
          index: txLog.index,
          quantity: formatUnits(event.args.amount, getDecimals(address)),
          to: account,
        };
      } else {
        return null;
      }
    }).filter(t => !!t);

    erc20Transfers.forEach(transfer => {
      log.info(`Found ${transfer.asset} transfer for ${
        transfer.quantity
      } from ${getName(transfer.from)} to ${getName(transfer.to)}`);
    });

    // Parse Weth
    erc20Transfers.forEach(transfer => {
      if (getName(transfer.from) === WETH) {
        tx.transfers.push(transfer);
        log.info(`ZAP Found weth swap in of ${
          transfer.quantity
        } ${transfer.asset} from ${getName(transfer.from)}`);
      }
    });

    // Parse Uniswap
    erc20Transfers.forEach(transfer => {
      const [to, from] = [getName(transfer.to), getName(transfer.from)];
      if (to.startsWith("UniV2")) {
        transfer.from = account;
        transfer.category = TransferCategories.SwapOut;
        tx.transfers.push(transfer);
        log.info(`ZAP Found swap out of ${
          transfer.quantity
        } ${transfer.asset} from ${getName(transfer.from)}`);
      } else if (from.startsWith("UniV2")) {
        transfer.to = account;
        transfer.category = TransferCategories.SwapIn;
        tx.transfers.push(transfer);
        log.info(`ZAP Found swap in of ${
          transfer.quantity
        } ${transfer.asset} to ${getName(transfer.to)}`);
      }
    });

    // parse 0x
    erc20Transfers.forEach(transfer => {
      const [to, from] = [getName(transfer.to), getName(transfer.from)];
      if (to.startsWith("ZeroEx")) {
        transfer.from = account;
        transfer.category = TransferCategories.SwapOut;
        tx.transfers.push(transfer);
        log.info(`ZAP Found swap out of ${
          transfer.quantity
        } ${transfer.asset} from ${getName(transfer.from)}`);
      } else if (from.startsWith("ZeroEx")) {
        transfer.to = account;
        transfer.category = TransferCategories.SwapIn;
        tx.transfers.push(transfer);
        log.info(`ZAP Found swap in of ${
          transfer.quantity
        } ${transfer.asset} to ${getName(transfer.to)}`);
      }
    });

    // parse bridge?

  }

  for (const txLog of ethTx.logs) {
    const address = txLog.address;
    if (polygonAddresses.map(e => e.address).includes(address)) {
      tx.sources = rmDups([polygonSource, ...tx.sources]);
      const name = getName(address);
      const event = parseEvent(plasmaBridgeInterface, txLog);
      if (event?.name === "NewDepositBlock") {
        log.info(`Got a ${name} ${event.name}`);
      }
    }
  }

  log.debug(tx, `parsed polygon tx`);
  return tx;
};

