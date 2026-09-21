# Cross-reference: lecture notes ↔ Mastering Bitcoin chapters 1-5

How to read these tables: **Teacher emphasis** records what happened in class (covered / mentioned / skipped). **Quiz likelihood** is our estimate of how likely a question on this topic is. The second table in each chapter lists concepts that were **not** in the lecture notes but are in the book and are plausible quiz material.

## Chapter 1 — Introduction

| Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes |
|---|---|---|---|---|---|
| What Bitcoin is (protocol, network, currency) | ch01 > What Is Bitcoin? | (fill in week/slide) | (fill in) | high | Expect a definition question |
| Satoshi Nakamoto, 2008 paper, 2009 launch | ch01 > History of Bitcoin | (fill in week/slide) | (fill in) | high | Dates are easy points |
| Four key innovations | ch01 > What Is Bitcoin? | (fill in week/slide) | (fill in) | high | Network, blockchain, consensus rules, proof-of-work |
| 21 million cap, satoshi unit | ch01 > What Is Bitcoin? | (fill in week/slide) | (fill in) | high | 1 satoshi = 0.00000001 BTC |
| Double-spend problem | ch01 > What Is Bitcoin? | (fill in week/slide) | (fill in) | high | Ties to proof-of-work |
| Full node vs lightweight (SPV) client | ch01 > Choosing a Bitcoin Wallet | (fill in week/slide) | (fill in) | medium | Book detail exceeds slides |
| Custodial vs noncustodial wallets | ch01 > Choosing a Bitcoin Wallet | (fill in week/slide) | (fill in) | high | "Who holds the keys" |
| Alice's first bitcoin walkthrough | ch01 > Getting Your First Bitcoin | not on slides | (fill in) | low | Narrative, not testable detail |

**Not in the lecture notes but likely on the quiz**

| Concept | Book section | Why it is likely | One-line answer to know |
|---|---|---|---|
| Bitcoin Core as reference implementation | ch01 > Bitcoin Development | Standard definition question | Bitcoin Core is the original reference implementation of the protocol, not "Bitcoin itself" |
| Pseudonymity vs anonymity | ch01 > What Is Bitcoin? | Common misconception item | Transactions are public; identities are pseudonymous, not anonymous |

## Chapter 2 — How Bitcoin Works

| Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes |
|---|---|---|---|---|---|
| UTXO model, inputs and outputs | ch02 > Bitcoin Transactions | (fill in week/slide) | (fill in) | high | Core of the chapter |
| Change outputs | ch02 > Transaction Inputs and Outputs | (fill in week/slide) | (fill in) | high | Outputs are indivisible |
| Fee = inputs − outputs | ch02 > Transaction Inputs and Outputs | (fill in week/slide) | (fill in) | high | Conceptual, not a calculation question |
| Output script / input script (lock and key) | ch02 > Transaction Inputs and Outputs | (fill in week/slide) | (fill in) | medium | Deeper in chapter 6+ |
| Transaction propagation to the network | ch02 > Adding the Transaction to the Ledger | (fill in week/slide) | (fill in) | medium | Flooding / gossip |
| Mining, proof-of-work, 10-minute blocks | ch02 > Bitcoin Mining | (fill in week/slide) | (fill in) | high | Nonce, target, difficulty |
| Block reward = subsidy + fees; halving | ch02 > Bitcoin Mining | (fill in week/slide) | (fill in) | high | 210,000 blocks ≈ 4 years |
| Confirmations and reversal risk | ch02 > Spending the Transaction | (fill in week/slide) | (fill in) | high | Six confirmations rule of thumb |
| Worked fee/change arithmetic | ch02 > Transaction Inputs and Outputs | not on slides | (fill in) | low | Instructor excluded calculations |

**Not in the lecture notes but likely on the quiz**

| Concept | Book section | Why it is likely | One-line answer to know |
|---|---|---|---|
| Common transaction forms (aggregating, distributing) | ch02 > Common Transaction Forms | Easy multiple-choice fodder | Aggregating = many inputs to one output; distributing = one input to many outputs |
| Block height and genesis block | ch02 > Mining Transactions in Blocks | Definition question | Height counts blocks from the genesis block at height 0 |
