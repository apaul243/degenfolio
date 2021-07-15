
# DEGENFOLIO
<b>This tool has won over $3k in prizes in the HackMoney 2021, where it impressed various sponsors like Idle, Harmony, Polygon and Covalent. </b>
<b> You can find demo at: https://showcase.ethglobal.co/hackmoney2021/degenfolio </b>

Degenfolio is the first of its kind, multi-chain portfolio and tax analysis tool. It is built over the npm package valuemachine. This tool is the result of a very high demand for portfolio and tax management as more and more individuals and businesses are pouring into the blockchain domain. 


<b> MAIN FEATURES </b>

-- Tracking portfolio performance over multi-chain assets  \
-- Parsing tx history from trading platforms like coinbase, wazirx, binance etc. \
-- Retrieving publicly available historical transaction data based on single address/ address book \
-- Processing and classifying the above data for portfolio analysis and tax filing purposes \
-- Providing visualization and analysis tools for better understanding your portfolio

<b> INSTALLATION </b>

-- Clone the GitHub repo using : git clone {repo-url} ( enter the repository url without the curly braces) \
-- Add an Etherscan api key to a `.env` file, create a new `.env` by copying the example: `cp .env.example .env` and then edit `.env`  \
-- Run: `make start` and then visit the app in your browser at localhost:3000 \
-- You can add your wallet address/addresses which will then sync transactions from the ethereum blockchain

<b> HOW DOES IT WORK </b>

-- In order to analyze your portfolio or create your tax report, you need to import your transactions. That can be done by:
1) Providing wallet address/addresses: Currently we only support Ethereum and Harmony based wallets. Valuemachine and Degenfolio provides various tools to easily      extend this functionality to other blockchains, which is reflective of the multichain nature of this tool.
2) Uploading Transaction CSVs : Since transactions that happen on platforms like Binance, Coinbase, Wazirx are not done through your own wallet, we have built        platform specific parsers to process these reports and render them to the list of transactions. Currently we support the above mentioned platforms only but the    functionality can be extended to any platform using our tool.

-- Once we gather your transactions from all the various sources, we run our parsers to further qualify them into different categories like Borrow, Repay,Deposit ,    Withdrawal , Income, Expense etc. \
-- For ex: When you enter your ethereum wallet address, we will run our different platform specific parsers(i.e Aave, Compound,      Polygon etc.) and these          parsers will find out what kind of tx it is using the emitted events and qualify it as so. \
-- After processing all your txs from all the sources, we have rendered it to the UI in form of graphs and a source based filter.

<b> HOW TO BUILD ON TOP OF DEGENFOLIO </b>

-- You can gather transactional data for your APIs from the blockchain or trading platforms (Coinbase, Binance etc) using this tool. \
-- Yield aggregators can be build on top of the tool to gather assets over multichains and invest them to maximize yield. \
-- Tax calculator: You can build country-specific tax report generators by using degenfolio portfolios. 



