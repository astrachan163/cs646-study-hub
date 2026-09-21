# Quiz 1 cross-reference: Mastering Bitcoin ch. 1-5 vs. Dr. Zheng's weeks 1-4

**Quiz:** "Quizzes for Mastering Bitcoin Chapters 01-05", 20 questions, 20 points, 10 minutes, Tuesday Sep 22 2026, 6:30 pm Central (in class). **Book:** Mastering Bitcoin, 3rd edition (Antonopoulos & Harding), the edition the syllabus assigns and week-4 slide 57 lists ("Chapters 1-6, 8, 10 & 13 ... 3Ed") together with the Nakamoto whitepaper. **Lectures:** week 1 (history of money), week 2 (hash functions, signatures, elliptic curves), week 3 (Chaum's untraceable e-cash), week 4 (Bitcoin on a public ledger). Only week 4 maps directly onto chapters 1-5; weeks 1-3 are the cryptography and history background that chapters 1 and 4 lean on.

How citations work: `W4 s18` = week-4 deck, slide 18. `+note` = Andrew's class note exists for that slide (the only record of what was said aloud). `slide only` = the slide exists but no note was taken, so it was probably shown quickly. `skipped` = a run of slides with no notes and evidence the instructor jumped past them.

Two structural facts shape everything below. First, the quiz is a **reading quiz on the book**, so book material the lecture never touched is still fair game. Second, the syllabus points (20 pts for 5 chapters, 20 for the next 5, 16 for the last 4) scale exactly with chapter count, so the working assumption is **about 4 questions per chapter**, one point each, 30 seconds each: recall-level multiple choice and true/false, not derivations.

---

## What the teacher actually covered (everything relevant to chapters 1-5)

### Week 1: A Brief History of Money (Aug 25)
- **Timeline ending in Bitcoin** (`W1 s2 +note`): spade money 1100 BC ... Sweden banknotes 1661 ... Western Union 1860, credit card 1946, **David Chaum's untraceable DigiCash 1982**, EU mobile banking 1999, **Satoshi Nakamoto's whitepaper 2008**. Andrew's note adds: "*Bitcoin.pdf paper refers to Hashcash*" (the book's ch01 says exactly this: Nakamoto combined digital signatures and Hashcash).
- **What is money?** (`W1 s3 +note`): medium of exchange, store of value, unit of account; "all three conditions must be met"; internet-age definition = a token for debiting/crediting accounts in a payments system; a monetary system = money + payment protocols + monetary policy. (Background for ch01's "digital money" framing; not in the book.)
- **Monetary policy / how much money to supply** (`W1 s13-14 +note`): Fisher's equation of exchange (calculation, out of scope); "most governments prefer inflation"; the ideal would track GDP. Sets up the week-4 question "how much to mint each year?", which Bitcoin answers with the fixed halving schedule (book ch01).
- **"What is Bitcoin?"** (`W1 s16 +note`): an asset for investment, a digital cash, "digital gold", an "anonymous" payment system for "black markets", a blockchain, a distributed consensus protocol. "Like touching an elephant close up, you can define it many different ways." Compare the book's four innovations (P2P network, blockchain, consensus rules, proof of work).

### Week 2: Cryptographic Foundations (Sep 1)
- **Three basic algorithms** (`W2 s2 +note`): one-way hash, public key digital signature, elliptic curve cryptography. These are the three tools chapter 4 uses.
- **One-way hash** (`W2 s4-9 +note`): any-length input (even an empty string) to a fixed output (e.g., 256 bits / 32 bytes); one-wayness ("theoretically you can but practically you cannot reverse"); collision resistance; two types of collision (given one input find another vs. find any pair); deterministic but behaves like a "random oracle" (any bit change gives a totally different output). "Anytime you have to organize unstructured data, a hash function is an important technique." Book: ch04 hash functions as commitments; ch02 hash property in mining.
- **SHA family and attacks** (`W2 s10-16 +note`): SHA-1 (1995) no longer secure; SHA-2 (2001, includes SHA-256) and SHA-3 (2015) secure; birthday paradox (23 people 50%, 57 people 99%); birthday attack needs about 2^(n/2) trials (SHA-256: 2^128). Book: ch04 collision-attack sidebar (160-bit HASH160 gives 2^80 collision resistance).
- **RSA** (`W2 s18-23 +note`): "very important (read it)" 1978 paper; "though bitcoin does not directly encrypt messages, the tools downstream do"; factoring is the hard problem; toy example (`s23`, no note, calculation). Book: RSA is not in ch01-05, but the idea of one-way functions (prime exponentiation, EC multiplication) is.
- **Digital signatures** (`W2 s24-27 +note`): "Encryption is not used directly in bitcoin/blockchain but does use the public key digital signature"; sign with the secret key, anyone verifies with the public key; properties: unforgeable, undeniable (non-repudiation), universally verifiable, differs per document; changing the signed amount invalidates the signature. Book: ch04 sidebar "Why Use Asymmetric Cryptography?" says the same.
- **Important signature schemes** (`W2 s28 +note`): RSA, DSS (discrete log), Schnorr (discrete log), elliptic-curve schemes ("signature schemas today currently use elliptic curve algorithms"), post-quantum (Dilithium, SPHINCS+); "RSA, DSS, Schnorr ... and elliptic curves can all be broken by quantum computers."
- **DSS and Schnorr** (`W2 s35-60 +note`): key setup, (r, s) signatures, "Bitcoin has moved to the (r, s) version" (of Schnorr), multi-signatures (MuSig, 3 rounds), indistinguishability, (t, n) threshold signatures ("a quorum, say 2/3"). All math is out of scope; the concepts "multiple parties can jointly produce one signature" and "t of n must cooperate" are the takeaways. Book: ch04 multisig via P2SH; ch05 SLIP39 threshold recovery codes (a different mechanism, same t-of-n idea).
- **Elliptic curves** (`W2 s61-77 +note`): "faster and more efficient"; y^2 = x^3 + ax + b over a finite field GF(p) ("In bitcoin, we will not use real numbers"); chord-and-tangent addition, additive inverse, base point / generator. Book: ch04 "Elliptic Curve Cryptography Explained".
- **secp256k1** (`W2 s79 +note`): "(E, G, p, n) are system-wide parameters used by all parties in Bitcoin"; "a Koblitz curve" y^2 = x^3 + 7 mod p with p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1 (the book prints the same p). Key pair (`W2 s80 +note`): pick d at random, Q = dG (the book writes k and K = kG).
- **ECDSA malleability** (`W2 s82 +note`): if (r, s) is valid so is (r, -s mod n) = (r, n - s), because r depends only on the x-coordinate of kG; "one of the root causes of Bitcoin transaction malleability"; remedy: make r depend on both coordinates. Book: ch03 "a txid is not authoritative" (malleability) and ch04 "segwit (2017) prevents txids from being changed".
- **EC-Schnorr and MuSig** (`W2 s83-85 +note`): "EC-Schnorr is better": security proofs, easy threshold signatures, blind signatures, free of malleability, cleaner/faster; "the EC-Schnorr Multi-Signature approach is what is actually used by bitcoin." Book: taproot (P2TR, bc1p addresses) in ch04 is where Schnorr lives; see the conflicts section.
- **Post-quantum** (`W2 s100 +note`): new blockchains must withstand quantum attacks; "ETH currently being ahead of Bitcoin."

### Week 3: Chaumian Untraceable Electronic Payments (Sep 8)
- **Life cycle of cash** (`W3 s2 +note`): withdraw (creation), payment, deposit (end of life); three parties (customer, shop, bank).
- **DigiCash / blind signatures** (`W3 s3-14 +note`): "1988 David Chaum ... this idea is the most important milestone"; the bank blindly signs coins so it cannot link withdrawal to deposit; RSA blind signature (math out of scope); denominations by public exponent; unlinkability. Book relevance: ch01's "Digital Currencies Before Bitcoin" (centralized digital cash that needed a bank).
- **"Important Questions"** (`W3 s15 +note`, repeated `s46`): how to detect/prevent double spending; how to give change / divide cash. The same two questions drive Bitcoin's design (ch01 double spend; ch02 change outputs).
- **Three techniques against double spending** (`W3 s16-18 +note`): (1) a bank database of spent coins ("effective for online payments: the bank revokes spent coins, real time"), (2) cut-and-choose to force correct coin format, (3) embed the customer ID so double spending reveals the cheater. Technique (1) is the book's "central clearinghouse". Bitcoin replaces the bank with a public ledger plus proof-of-work consensus.
- **Security properties** (`W3 s43-44`, note at s41-42): the scheme detects rather than prevents double spending and identifies the fraudster "with almost certainty"; anonymity holds "as long as the shop does not collude with the bank."
- **Merkle hash tree** (`W3 s45 +note`): shortens the coin's tail to a single hash; "mathematically unimportant, but more compact for efficiency." Bitcoin uses the same structure for block headers (`W4 s11`).
- **Advantages and drawbacks** (`W3 s48`, `s50`, notes: "Drawbacks"): advantages: anonymous, double-spend detection, coins minted jointly by users and banks, "minting does NOT contribute to inflation/deflation"; drawbacks: not transferable ("more like a check"), requires banks and accounts, needs trust in banks, banks must track all spent coins. `W3 s53 +note`: eCash 2.0 / Project Tourbillon = central-bank version.

### Week 4: Bitcoin on a Public Ledger (Sep 15): the chapter 1-5 week
- **Ledger analogy** (`W4 s3-5 +note`): a ledger records transactions; a village's combined ledger needs each transaction recorded once and needs no physical cash; Bitcoin = an electronic, combined, **public**, **anonymous** ledger: "Only transactions are recorded! No balance is shown"; "user accounts are created on the fly when receiving a payment (= a random number!)"; "Bitcoin has no total balance, name, or account tied to the transaction = anonymous." Book: ch01 addresses are generated by the wallet and never registered; ch02 UTXOs (balances are computed, not stored).
- **Questions to be addressed** (`W4 s6 +note`): (1) link an anonymous account to its owner, (2) claim money received, (3) spend it, (4) prevent double spending, (5) minting: how, who, how much each year. Q1-Q3 are answered on `s7-9`; Q4 by the consensus committee (`s10-12`); Q5 is answered only in the book (miners, block reward, halving toward 21 million).
- **Digital signature and one-way hash recap** (`W4 s7-8`, note at s7): "Alice + public key + document + secret signing key + signature = signed document" (Andrew bolded this himself); `s8` (one-way hash) has no note.
- **Account # = Hash(Kp)** (`W4 s9 +note`): when receiving payment, generate a random key pair (Kp, Ks) and use the one-way hash of the public key as the account number; claim money by signing with Ks; anyone verifies with Kp. Book: exactly P2PKH (HASH160 of the public key) in ch04.
- **Key ideas / 10-minute clock** (`W4 s10-11 +note`): "Bitcoin has a system clock: 1 [block]/10 mins"; the transactions of the last 10 minutes are checked by a "consensus committee" and "stamped as validated and added, irreversibly, to the public ledger"; blocks form a "1-way hash chain"; a **Merkle hash tree** of the transactions produces the header hash. Book: ch01/ch02 10-minute average, ch02 mining and confirmations.
- **Ecosystem** (`W4 s12 +note`): wallets; miners = server farms acting as the consensus committee, "rewarded in form of new bitcoin created as part of the block"; nodes (~10K full nodes 9/2020); the blockchain. Book: ch02 overview (users/wallets, transactions, miners).
- **Bitcoin Core** (`W4 s13 +note`): install link bitcoin.org/en/download; "the software to mine bitcoin; current size is 768 GB for the total bitcoin blockchain ledger"; "takes a lot of GPUs." Book: ch03 Bitcoin Core is the reference implementation / full node (>500 GB in 2023). See conflicts.
- **P2P network** (`W4 s15-16` slide only: 16K nodes 9/2023, Bitnodes; `W4 s34-36 +note`): no central authority, each node relays; "Gossip Protocol for P2P decentralization"; no centralized server, flat topology, global, nodes join/leave, "hard to shutdown unless countries work together"; "network requires an incentive for running." Book: ch01/ch02.
- **Transaction anatomy** (`W4 s17 +note`, slide labelled "Important info"): a TX is identified by its hash; "From" = hash of the unspent TX being spent + sender's public key + sender's signature; "To" = hash of receiver's public key + amount; "does the sender have the money?" and "integrity" both answered by the signature; "When" = set when tied to the blockchain (Andrew: "implicitly included by the sequential block number ... no precise moment"). "Hash is fragile ... DO NOT INSERT ANY SPACES OR CHARACTERS." Book: ch02 inputs/outputs, txid; ch04 signatures.
- **Alice pays Bob, step by step** (`W4 s18-23 +note`): TX200 spends TX100; "Bob accepts if (1) TX100 is in a database of unspent TXs (2) Alice's signature is valid" (Andrew: "most important two events"); two inputs of 50 to pay 100 (`s19`); two outputs to pay Bob 40 and Charlie 60 (`s20`: "bitcoin would disappear if bitcoin did not allow you to pay yourself in the same TX"); **change** as a third output back to Alice (`s21`: "spend the entire transaction at one time ... leftover becomes an additional transaction back to yourself"); three inputs (`s22`); **fee** = input total minus output total (`s23`: "tip for the miner ... the top is always larger than the bottom ... If the tip is 0, the transaction will never be picked up by the miner"). Book: ch02 transaction chains, change, implied fee.
- **m inputs, n outputs** (`W4 s24 +note`): sum of outputs <= sum of inputs; the difference is the miner's fee; UTXO = unspent coin; "Know what big input/output vs small input/output mean." Book: ch02 common transaction forms (consolidation vs batching).
- **Units and bookkeeping** (`W4 s25`, slide only): "1 BTC = 100,000,000 Satoshi"; double-entry (debit & credit) vs triple-entry (credit, debit & receipt) bookkeeping. Book: ch02 double-entry analogy; satoshi.
- **Block summary** (`W4 s26 +note`): a block = fixed-size header + the transactions of the last 10 minutes; chain of one-way hashes, "unmodifiable after 10 minutes."
- **TX format** (`W4 s27-28 +note`): "Format of Regular TX (max. 10,000 bytes)": version, input count, inputs (TXID of the UTXO, index n, ScriptSig length, ScriptSig = "typically signature + public key", sequence), output count, outputs (value in satoshis, scriptPubKey length, scriptPubKey), lock_time. Book: ch03 decoded transaction fields (vin/vout/scriptSig/scriptPubKey/locktime); full detail is ch06.
- **UTXO context** (`W4 s29 +note`): a UTXO is identified by TXID + index; "negligible probability for 2 TXs to share the same ID"; "Miners maintain a database of current UTXOs" (Andrew: "Bitcoin doesn't tell you how much you have, but the transactions"). Book: ch02/ch03.
- **Raw transaction examples** (`W4 s30-31`, slide only): hex decoding with `OP_DUP OP_HASH160 <20-byte hash> OP_EQUALVERIFY OP_CHECKSIG` (P2PKH), a secp256k1 signature, satoshis; JSON with "TXID (NOT included in TX!)". Book: ch03 `decoderawtransaction`, ch04 P2PKH script.
- **Scope of signature / SIGHASH** (`W4 s32 +note`): four hash types, SIGHASH_ALL default; "doesn't matter which, but just that it is valid." Not in ch01-05.
- **TXID** (`W4 s33 +note`): "TXID = Double_SHA256(Transaction)", a 32-byte value. Book: 32-byte txid (ch02); the double-SHA256 detail is ch06.
- **Node types** (`W4 s37-42 +note`): a full node can hold a wallet, mine, store the full blockchain, and route; "full nodes are small percentage overall"; most miners do not store wallets; "almost all are now pool miners" (Stratum server, `s39`); `s40` SPV = Simplified Payment Verification (no note); four P2P functions: discovery, connecting, exchange of inventory, gossip (`s42 +note`). Book: ch01 full node vs lightweight/SPV, ch02 pools and gossiping.
- **Closing** (`W4 s56 +note`): "To end: Explore the blockchain, transactions, etc." (Blockchair, Blockchain.com, BlockCypher). `W4 s57`: references: the whitepaper and Mastering Bitcoin 3Ed ch. 1-6, 8, 10 & 13.

## Skipped or rushed slides (low priority)

- **W4 s43-55, the "$3,000,000,000 TXs" / Individual X / Silk Road case study**: no notes; the closing note jumps to s56. Content: a consolidation transaction in block 655282, a transfer to a Feds address in the next block "in 5 min.!" and "without waiting for 6 confirmations", a `1HQ3...` pay-to-pubkey-hash address vs a `bc1q...` pay-to-witness-pubkey-hash address, explorer JSON. Worth one glance because it illustrates consolidation, confirmations, and legacy-vs-segwit addresses, all of which are in the book anyway.
- **W4 s25** (1 BTC = 100,000,000 satoshi; double vs triple entry) and **W4 s30-31** (raw TX examples): shown between noted slides, no notes. The satoshi fact is also in the book, so keep it; triple-entry bookkeeping is lecture-only trivia.
- **W4 s8, s14-16, s34-35, s40-41**: image or recap slides (one-way hash recap, "another way to look at Bitcoin", node counts, network diagrams, SPV title, extended network). Concepts are covered elsewhere.
- **W2 s23** (RSA toy example), **s64**, **s78**, **s86-96** (EC-MuSig derivation rounds), **s99**, **s101**: no notes; the MuSig mechanics are far beyond ch01-05.
- **W3 s24-25, s30-31, s36, s39-40, s46-48, s51-52, s54-61**: transitions, repeats, eCash 2.0 / Tourbillon, divisible cash research, references. Andrew's one-line note at s53 covers the tail.
- **Week 1**: nothing skipped, but only s2 (timeline) and s16 (What is Bitcoin) bear on the quiz.

## Explicitly out of scope (calculations; verbal ruling)

The instructor said calculating anything is out of scope (a spoken remark, not printed anywhere). Concept-level questions about these topics remain possible; working numbers does not:
- Fisher equation M x V = P x Y (`W1 s13-14`).
- RSA key setup, encryption/decryption, signatures, blind-signature algebra (`W2 s21-23, s29-34`; `W3 s6-12`).
- DSS and Schnorr signing/verification, MuSig rounds, threshold signatures (`W2 s35-60, s80-99`).
- Elliptic-curve point addition/doubling formulas and worked examples (`W2 s63-77`).
- Cut-and-choose probabilities (1/2^k), denomination exponents (`W3 s22-23, s32-38, s43`).
- Fee arithmetic on specific amounts (`W4 s23-24`), byte sizes of TX fields (`W4 s28`), hex decoding (`W4 s30-31`).
- In the book: the secp256k1 equation constants, the private-key range n ~ 1.158 x 10^77, vanity-address search times, BIP39 word-count arithmetic beyond the 12 = 128 bits / 24 = 256 bits endpoints, the whitepaper's attacker-success probabilities.

---

## Chapter 1: Introduction

| Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes |
|---|---|---|---|---|---|
| What Bitcoin is; four innovations (P2P network, blockchain, consensus rules, PoW) | ch01 Introduction | W1 s16 +note ("What is Bitcoin?": asset, digital cash, digital gold, anonymous payment system, blockchain, distributed consensus protocol) | covered | high | Expect a "which is NOT a way to describe Bitcoin" or "which is not one of the four components" item; know both lists. |
| Bitcoin (system) vs bitcoin (unit); coins exist only as transactions | ch01 Introduction | W4 s5 +note ("Only transactions are recorded! No balance is shown") | covered (ledger model) | high | Lecture's "no balance" = book's UTXO model. |
| Keys control funds; possession of the signing key is the only prerequisite to spend | ch01 Introduction; Who controls the keys | W4 s6 Q1-Q3, s9 +note | covered | high | "Your keys, your coins" slogan is book-only wording. |
| 10-minute average block interval; difficulty adjusts to hold it | ch01 Introduction | W4 s10-12, s26 +note ("system clock: 1 block/10 mins") | covered (strongly) | high | Lecture never mentioned difficulty adjustment; the book does. |
| Issuance: block reward, halving every 4 years, cap just under 21 million, ~99% by 2035, long-run deflationary | ch01 Introduction | W4 s6 Q5 +note (how/who/how much to mint?); W4 s12 +note (miners rewarded with new bitcoin); W1 s14 +note (governments prefer inflation) | mentioned (question posed; book gives the answer) | high | Numbers beyond 21M / 4 years are low priority. |
| Double-spend problem; pre-Bitcoin central clearinghouse; Bitcoin's PoW consensus solves it | ch01 Digital Currencies Before Bitcoin; History of Bitcoin | W4 s6 Q4 +note; W3 s15-18 +note (spent-coin database, cut-and-choose, embedded IDs); W3 s50 (needs banks) | covered (whole week 3 theme) | high | Book says "central clearinghouse"; lecture's "database of spent coins" is the same idea. |
| History: 2008 paper, 2009 network, Nakamoto leaves April 2011, digital signatures + Hashcash | ch01 History of Bitcoin | W1 s2 +note (2008 whitepaper; "refers to Hashcash"); W4 s57 (Oct 31, 2008) | covered (timeline) | high (2008), medium (rest) | W4 s2 title "The Bitcoin paper, May 24, 2009" is a PDF revision date; the paper is 2008. |
| Byzantine Generals' Problem | ch01 History sidebar | not mentioned | not covered | medium | Book-only but a classic MCQ. |
| Wallet = user interface (browser analogy); Bitcoin Core = reference implementation with wallet | ch01 Getting Started | W4 s12 +note (wallets in the ecosystem); W4 s13 +note (Bitcoin Core) | covered (Core), mentioned (wallets) | high (Core), medium (analogy) | Lecture called Core "the software to mine bitcoin"; book says reference implementation / full node. |
| Wallet types by platform (desktop, mobile most common, web, hardware signing devices need a paired wallet) | ch01 Choosing a Bitcoin Wallet | not mentioned | not covered | medium | Book-only; hardware-signing-device nuance is a good distractor. |
| Full node vs lightweight (SPV) vs third-party API client; peers vs clients | ch01 Full node versus Lightweight | W4 s37-40 +note (full node functions; SPV title s40; "full nodes are small percentage") | covered | high | Lecture's full node = wallet + miner + blockchain + routing (book ch10 model). |
| Custodial vs noncustodial; recovery code basics; phishing warning | ch01 Who controls the keys; Recovery Codes | W4 s9 +note (only the holder of Ks can spend) | mentioned (principle) | medium | Recovery-code details are book-only. |
| Addresses generated by the wallet, not registered; safe to share; new address per payment for privacy | ch01 Bitcoin Addresses | W4 s5, s9 +note (accounts "created on the fly ... a random number"; hash of a fresh public key) | covered | high | Lecture frames it as anonymity; book as privacy/address reuse. |
| Irreversibility; buying bitcoin (KYC at exchanges); price set by markets | ch01 Getting Your First Bitcoin; Finding the Current Price | not mentioned | not covered | medium (irreversibility), low (price) | |
| Units: 1 BTC = 100,000,000 satoshi; 0.001 BTC = 1 mBTC = 100,000 sat | ch01 Sending and Receiving; ch02 NOTE | W4 s25 (slide only); W4 s28 (value field in satoshis) | mentioned (slide only) | high | One of the easiest MCQs to write. |
| Unconfirmed vs confirmed; confirmation = clearing | ch01 Confirmations sidebar | W4 s10 +note (validated batch "added, irreversibly"); W4 s17 +note (time set when tied to the blockchain) | covered | high | |
| Whitepaper abstract: majority of honest CPU power; coin = chain of digital signatures | Appendix A / whitepaper | W4 s57 (assigned reading); W4 s17-18 (input = hash of previous TX + signature + public key) | mentioned (assigned) | medium | |

**Not in the lecture notes but likely on the quiz (chapter 1)**

| Concept | Book section | Why it is likely | One-line answer to know |
|---|---|---|---|
| Four key innovations | ch01 Introduction | Bulleted list in the chapter's first page; textbook-quiz staple | P2P network (protocol), blockchain (public journal), consensus rules, proof-of-work consensus |
| Byzantine Generals' Problem | ch01 History sidebar | Named sidebar; classic distributed-systems term | Leaderless agreement over an unreliable network; Bitcoin's PoW solves it without a trusted authority |
| Nakamoto's departure and anonymity | ch01 History | Dates are easy MCQ fodder | Paper 2008, network 2009, Nakamoto withdrew April 2011; nobody controls Bitcoin |
| Difficulty adjustment keeps the 10-minute average | ch01 Introduction | Pairs with the lecture's "10-minute clock" | Difficulty is adjusted dynamically so blocks arrive every ~10 minutes regardless of hash power |
| Deflationary long-term issuance; 21M cap | ch01 Introduction | The lecture asked "how much to mint each year?" | Halving every ~4 years toward just under 21 million; long term the currency is deflationary |
| Wallet type categories and "hardware wallets need a paired wallet" | ch01 Choosing a Bitcoin Wallet | Definitional list | Desktop (first), mobile (most common), web (third-party server), hardware signing device (must pair with a full wallet) |
| Recovery code = randomly generated words, basis for all keys; restores keys but not labels; asked only at setup/recovery | ch01 Recovery Codes | Clear definitions and a WARNING box | Also called mnemonic/seed phrase; write it down; malware asking for it is phishing |
| "Your keys, your coins" | ch01 Who controls the keys | Memorable slogan | Whoever controls the private keys controls the funds; custodians control theirs |
| Bitcoin transactions are irreversible (why sellers require KYC) | ch01 Getting Your First Bitcoin | Contrast with cards is a natural T/F | Cards/PayPal reverse; bitcoin does not; so bitcoin sellers verify identity |
| Price set by markets (floating rate, volume-weighted average) | ch01 Finding the Current Price | Easy MCQ | Supply and demand across exchanges; no authority sets it |

## Chapter 2: How Bitcoin Works

| Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes |
|---|---|---|---|---|---|
| System = wallets/keys, transactions, miners producing the consensus blockchain | ch02 Bitcoin Overview | W4 s12 +note (ecosystem) | covered | high | |
| Transaction = authorization to transfer value; chain of ownership | ch02 Bitcoin Transactions | W4 s3, s17 +note | covered | high | |
| Inputs spend, outputs receive; double-entry bookkeeping analogy | ch02 Transaction Inputs and Outputs | W4 s17-24 +note; W4 s25 (slide only: double vs triple entry) | covered | high | Triple-entry is lecture-only trivia (low). |
| Fee is implied: outputs total < inputs total; miner collects the difference; higher fee rate = faster | ch02 Inputs and Outputs; Creating the Outputs; Mining | W4 s23-24 +note ("tip"; "top always larger than bottom"; "if the tip is 0, never picked up") | covered (strongly, E3) | high | Lecture-only claim: zero-fee TX is never mined. |
| Input references previous output by txid + index; input value not stored | ch02 Transaction Chains | W4 s17-18 +note (hash of unspent TX); W4 s29 +note (TXID + index unique) | covered | high | |
| Signature in each input proves ownership; nodes check unspent + valid signature | ch02 Inputs and Outputs; Bob's view | W4 s18-23 +note ("most important two events") | covered (strongest emphasis in week 4) | high | Book phrasing: spends valid UTXOs, well formed, signatures verify. |
| Change output: inputs cannot be partly spent; pays a new address; protocol-identical to a payment output; changeless TX | ch02 Making Change | W4 s20-23 +note ("pay yourself in the same TX"; "spend the entire transaction at one time") | covered | high | |
| Coin selection | ch02 Coin Selection | W4 s19, s24 +note (wallets construct the TX; m inputs) | mentioned | medium | |
| Transaction forms: 1-in/2-out simple payment, consolidation (many-in/1-out), batching (1-in/many-out) | ch02 Common Transaction Forms | W4 s24 +note ("know what big input/output vs small input/output mean"); W4 s44 (skipped: "Consolidate") | covered | high | |
| UTXO definition; full node tracks all UTXOs; miners keep the UTXO database | ch02 Getting the Right Inputs | W4 s24, s29 +note | covered | high | |
| Output script encumbers value to the holder of the key matching the address | ch02 Creating the Outputs | W4 s17-18 ("To" = hash of receiver's public key); W4 s27-30 (scriptPubKey) | covered | high | |
| Offline construction and signing | ch02 Constructing a Transaction | not mentioned | not covered | low | |
| Propagation: any node, gossiping, seconds; full verification nodes | ch02 Adding the Transaction to the Blockchain | W4 s35-36, s42 +note (gossip protocol; P2P functions) | covered | high | |
| Transaction enters the blockchain only when mined into a validated block | ch02 Bitcoin Mining | W4 s10-11 +note (consensus committee; irreversible) | covered | high | |
| Proof of work: hard to create, one hash to verify; candidate block lottery; ~168 billion trillion tries | ch02 Bitcoin Mining | not mentioned as such (lecture used "consensus committee"; W1 s2 note mentions Hashcash) | not covered | medium | Book-only mechanism; the term PoW is in the book's four innovations. |
| Two purposes of mining; reward = new coins + fees only for valid blocks | ch02 Bitcoin Mining | W4 s12 +note (miners rewarded with new bitcoin); W4 s23 +note (fee tip) | covered | high | |
| Fee-rate prioritization; mining pools share reward | ch02 Bitcoin Mining | W4 s23 +note; W4 s39 +note (almost all pool miners; Stratum) | covered | medium-high | |
| Confirmations count per block on top; six-confirmation convention; best chain = most total PoW | ch02 Bitcoin Mining | W4 s10 +note (irreversible); W4 s51 (skipped: "without waiting for 6 confirmations") | covered (irreversibility), skipped (six) | high | "Most total proof of work" vs whitepaper "longest chain": know both. |
| Genesis block (#0) | ch02 Bitcoin Mining | not mentioned | not covered | medium | |
| Full node validates whole history; SPV checks inclusion + depth | ch02 Spending the Transaction | W4 s40 (SPV, slide only) | mentioned | medium | |
| Block = header + last 10 minutes of transactions; Merkle tree root; hash chain | Whitepaper 3, 7; ch03 getblock fields | W4 s11, s26 +note | covered | medium | Book ch01-05 does not define Merkle trees; the whitepaper does. |
| TXID = double SHA256; not stored in the TX; max TX size 10,000 bytes; TX fields; SIGHASH types; time implied by block | (ch06/ch08 territory; ch03 shows decoded fields) | W4 s17, s27-28, s31-33 +note | covered (lecture-only vs ch01-05) | medium-high | Answer with the instructor's facts if asked. |
| BIP21 invoice URI; block explorers | ch02 Buying from an Online Store; Overview | W4 s56 +note (explorers) | mentioned | low (BIP21), medium (explorers) | |

**Not in the lecture notes but likely on the quiz (chapter 2)**

| Concept | Book section | Why it is likely | One-line answer to know |
|---|---|---|---|
| Proof of work as a lottery; easy to verify, hard to produce | ch02 Bitcoin Mining | Core mechanism named in ch01's four innovations; lecture only said "consensus committee" | Miners hash candidate blocks until the hash fits a template; anyone verifies with one hash |
| Six confirmations convention | ch02 Bitcoin Mining | Classic number; appears on a skipped slide too | >6 confirmations = very hard to change (attacker must redo 6 blocks + 1) |
| Best blockchain = most total proof of work | ch02 Bitcoin Mining | Distinguishes book from whitepaper wording | Full nodes follow the valid chain with the most cumulative PoW ("longest chain" in the whitepaper) |
| Genesis block | ch02 Bitcoin Mining | Simple definition | Block #0, the first block, to which all later blocks link |
| Changeless transaction | ch02 Making Change | Definitional | A single-output transaction with no change |
| Change output is protocol-identical to a payment output | ch02 Making Change | Good T/F | No flag marks change; wallets send it to a fresh address for privacy |
| Offline construction | ch02 Constructing a Transaction | Counterintuitive T/F | A wallet that knows its UTXOs can build and sign offline, like writing a check at home |
| Why miners won't help reverse a confirmed payment | ch02 Bitcoin Mining | Reasoning question | Reversal needs two new blocks for a small payment; one honest block earns more |
| Whitepaper: nodes accept a block only if all its transactions are valid and unspent; one-CPU-one-vote; first TX creates the coin; fees can replace issuance | Whitepaper 4-6 | Assigned reading on W4 s57 | See the four items in the question bank tagged `whitepaper` |

## Chapter 3: Bitcoin Core: The Reference Implementation

| Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes |
|---|---|---|---|---|---|
| Full verification node: verifies every transaction against every rule; your node's data is authoritative | ch03 opening | W4 s37 +note (full node functions) | covered | high | |
| Bitcoin Core = reference implementation; open source (MIT); >1,000 contributors; code preceded the paper | ch03 From Bitcoin to Bitcoin Core | W4 s13 +note (install Core; "software to mine bitcoin") | covered (mentioned as software) | high (reference implementation), low (license/history) | Conflict: lecture says "mine"; book says reference implementation / full node. |
| BIPs (Bitcoin Improvement Proposals), BIP9 | ch03 From Bitcoin to Bitcoin Core | not mentioned | not covered | medium | Book uses BIP numbers constantly (BIP16, 21, 32, 39, 44, 173, 350). |
| Compiling from source: git tags, rc, autogen/configure/make/make check/make install | ch03 Compiling Bitcoin Core | not mentioned | not covered | low | The book itself says this section can be skipped. |
| Running a node: >500 GB (2023), 400 MB/day, 1 TB disk; why run one (validation, privacy, API, support) | ch03 Running a Bitcoin Core Node | W4 s13 +note ("768 GB"); W4 s15-16 (16K nodes); W4 s36 +note ("network requires an incentive") | mentioned | medium (why), low (numbers) | Numbers differ by date, not in substance. |
| Cannot process transactions until fully synced; pruning still downloads everything | ch03 Running a Bitcoin Core Node | not mentioned | not covered | low-medium | Good T/F distractors. |
| Configuration: ~/.bitcoin/bitcoin.conf; txindex, prune, dbcache (UTXO cache 450 MiB), blocksonly, maxmempool; -daemon | ch03 Configuring the Bitcoin Core Node | W4 s29 +note (miners keep the UTXO database) for dbcache only | not covered (except UTXO concept) | low-medium | txindex is the most quotable option. |
| Headers-first sync (blocks 0, headers 83,999) | ch03 Configuring the Bitcoin Core Node | not mentioned | not covered | medium | |
| JSON-RPC API over HTTP :8332; bitcoin-cli; cookie auth; help | ch03 Bitcoin Core API | not mentioned | not covered | medium (JSON-RPC/bitcoin-cli), low (port, cookie) | |
| getblockchaininfo / getnetworkinfo / getmempoolinfo / getwalletinfo | ch03 Getting Information | not mentioned | not covered | low | |
| getrawtransaction (hex) + decoderawtransaction (JSON); Alice's 1-in/2-out TX | ch03 Exploring and Decoding Transactions | W4 s30-31 (slide only: raw hex and decoded JSON) | mentioned (slide only) | medium | |
| txid is not authoritative before confirmation (malleability); reorgs after confirmation | ch03 Exploring and Decoding Transactions TIP | W2 s82 +note (ECDSA twin signatures cause malleability) | covered (root cause) | high | Strong lecture-book link. |
| getblockhash (height) then getblock (hash); confirmations = depth vs height; mediantime | ch03 Exploring Blocks | W4 s44-45 (skipped: block 655282 -> 655283) | skipped | high (depth vs height), low (mediantime) | |
| Alternative implementations (btcd, bitcoinj, bcoin ...); python-bitcoinlib | ch03 Alternative Clients | not mentioned | not covered | low | |
| Node types: full node functions (wallet, mining, blockchain, routing); solo vs pool miner; Stratum | (ch10 material; ch01/ch03 full node) | W4 s37-39 +note | covered | medium | Lecture-only detail relative to ch01-05. |

**Not in the lecture notes but likely on the quiz (chapter 3)**

| Concept | Book section | Why it is likely | One-line answer to know |
|---|---|---|---|
| "Reference implementation" meaning | ch03 From Bitcoin to Bitcoin Core | Definitional; the chapter title | Defines how each part should be implemented: wallet, validation engine, block construction, P2P |
| BIPs | ch03 From Bitcoin to Bitcoin Core | Acronym MCQ | Bitcoin Improvement Proposals, the specs for most changes since 2011 (e.g., BIP9 upgrades) |
| MIT open-source license, volunteer community | ch03 From Bitcoin to Bitcoin Core | Factual | Open (MIT) license; >1,000 contributors by 2023 |
| Reasons to run a node | ch03 Running a Bitcoin Core Node | Bulleted list | No third-party validation, privacy, API for developers, consensus-rule validation, support the network; nodes do not earn fees |
| Pruning still downloads the whole chain; no balances until synced | ch03 Running a Bitcoin Core Node | T/F material | Prune deletes old blocks after download; sync must finish before balances show |
| txindex=1 | ch03 Configuring | Most-quotable option | Index all transactions so any txid can be fetched; default indexes only wallet transactions |
| Headers-first synchronization | ch03 Configuring | Explained via the blocks/headers example | Fetch headers to find the most-PoW chain, then download and validate blocks |
| JSON-RPC via bitcoin-cli | ch03 Bitcoin Core API | The chapter's tool | JSON-RPC over HTTP (port 8332); bitcoin-cli is the helper, bitcoind the node |
| getrawtransaction / decoderawtransaction | ch03 Exploring and Decoding Transactions | Command pair | Raw hex, then decode to JSON |
| confirmations (depth) vs height | ch03 Exploring Blocks | Conceptual contrast | Height = blocks before it; confirmations = blocks built on top (grows over time) |

## Chapter 4: Keys and Addresses

| Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes |
|---|---|---|---|---|---|
| Asymmetric crypto is for signatures, not encryption; public key receives, private key signs | ch04 Public Key Cryptography (sidebar) | W2 s18-27 +note ("encryption is not used directly in bitcoin"); W4 s7, s9 +note | covered (strongly, B1/B2) | high | Top cross-over fact. |
| Private key = random 256-bit number; entropy/CSPRNG; lost = gone, revealed = stolen | ch04 Private Keys | W2 s80 +note (pick d at random); W4 s9 +note (random key pair) | covered | high | CSPRNG detail is book-only. |
| ECC based on the discrete logarithm problem; secp256k1: y^2 = x^3 + 7 over F_p; generator G; K = kG one-way | ch04 Elliptic Curve Cryptography Explained; Public Keys | W2 s41-42, s61-63, s68, s77, s79-80 +note (Koblitz curve; (E, G, p, n); Q = dG) | covered (in depth) | high | Notation: lecture d/Q, book k/K. "Koblitz" is lecture-only; book says the standard is from NIST. |
| Point at infinity, chord/tangent addition | ch04 ECC Explained | W2 s71-74 +note (rules), calculations skipped | mentioned (concept), out of scope (math) | low | |
| Output script ~ public key, input script ~ signature; stack evaluation; OP_CHECKSIG | ch04 Output and Input Scripts; P2PK | W4 s27-28 +note (ScriptSig = signature + public key; scriptPubKey); W4 s30 (slide only) | mentioned | medium | |
| IP-address payments and P2PK (Bitcoin 0.1) | ch04 IP Addresses (P2PK) | not mentioned | not covered | low | |
| Hash function output as a commitment; SHA256 (32 B) then RIPEMD-160 (20 B) = HASH160; P2PKH script and why (20 B vs 65 B) | ch04 Legacy Addresses for P2PKH | W2 s4-9 +note (one-way, collision resistance); W4 s9 +note (Account # = Hash(Kp)); W4 s30 (OP_HASH160, 20-byte hash) | covered (hash of public key = account), book-only (RIPEMD-160 step) | high | "Address is a hash of the public key, not the key" is the thing to know. |
| Base58 (drops 0 O l I + /); base58check version byte + 4-byte double-SHA256 checksum; prefixes 1 / 3 / 5,K,L / xpub | ch04 Base58check Encoding | not mentioned | not covered | medium | Prefix table is prime MCQ material. |
| Compressed (33 B, 02/03) vs uncompressed (65 B, 04) public keys; different addresses from the same key | ch04 Compressed Public Keys | W4 s31 (slide only: 04... uncompressed keys in the example) | not covered | medium | |
| P2SH (BIP16, 2012): redeem script, prefix 3, not necessarily multisig; legacy = P2PKH + P2SH | ch04 Legacy Pay to Script Hash | W2 s47-48 +note (multi-signatures concept) | mentioned (multisig idea only) | medium | |
| Collision attacks: 160-bit HASH160 gives 2^80 when the attacker influences input; newer addresses >=128 bits | ch04 P2SH Collision Attacks | W2 s6, s11-16 +note (two collision types; birthday attack 2^(n/2)) | covered (birthday attack) | high | Direct lecture-book bridge. |
| Segwit (2017) fixes third-party txid malleability, adds capacity | ch04 Bech32 Addresses | W2 s82 +note (ECDSA twin signature = root cause of malleability); W2 s84 (Schnorr free of malleability) | covered (cause) | high | |
| Bech32: single case, 32-char alphabet, BCH checksum, detects <=4 errors, locates them, QR-friendly; problems with base58check | ch04 Bech32 Addresses | not mentioned | not covered | medium | |
| bc (mainnet) / tb (testnet); "1" separator; q = v0 (bech32), p = v1 taproot (bech32m); P2WPKH 20 B, P2WSH 32 B SHA256, P2TR | ch04 Bech32m | W4 s46, s49-50 (skipped: bc1q... pay-to-witness-pubkey-hash vs 1HQ3... pay-to-pubkey-hash) | skipped | medium | |
| Bech32m fixes the "q" insertion bug by changing one constant | ch04 Bech32m | not mentioned | not covered | low | |
| WIF (0x80, starts with 5) and WIF-compressed (0x01 suffix, K/L); "compressed private key" misnomer | ch04 Private Key Formats | not mentioned | not covered | low-medium | |
| Vanity addresses (equally secure, brute force, obsolete); paper wallets obsolete/dangerous | ch04 Advanced Keys and Addresses | not mentioned | not covered | medium (paper wallets), low (vanity) | |
| Signature properties; SHA family; RSA vs discrete log; ECDSA vs Schnorr/MuSig; post-quantum | (ch04 background) | W2 s10, s16, s26-28, s33, s82-85, s100 +note | covered (lecture-only vs ch01-05) | medium | Answer with the instructor's framing if asked. |

**Not in the lecture notes but likely on the quiz (chapter 4)**

| Concept | Book section | Why it is likely | One-line answer to know |
|---|---|---|---|
| HASH160 = RIPEMD160(SHA256(K)), 20 bytes | ch04 Legacy Addresses for P2PKH | Central formula of the chapter | SHA256 (32 B) then RIPEMD-160 (20 B); commitment to the public key |
| Base58 omitted characters | ch04 Base58check | Easy MCQ | 0, O, l, I and + / removed to avoid confusion |
| Base58check checksum | ch04 Base58check | Definitional | 4 bytes = first 4 bytes of SHA256(SHA256(version + data)); catches typos |
| Address prefix table | ch04 Base58check | Prime MCQ | 1 = P2PKH (0x00), 3 = P2SH (0x05), 5/K/L = WIF private key (0x80), xpub = extended public key, m/n = testnet, bc1 = segwit |
| Compressed vs uncompressed public keys | ch04 Compressed Public Keys | Counterintuitive fact | 33 B (02/03 + x) vs 65 B (04 + x + y); same private key, different addresses |
| P2SH and BIP16 (2012) | ch04 Legacy P2SH | Dates and prefixes | Output commits to a redeem script's HASH160; address starts with 3; not always multisig |
| bc1q vs bc1p | ch04 Bech32m | Modern addresses | q = segwit v0 (bech32); p = v1 taproot (bech32m); bc = mainnet, tb = testnet; "1" is a separator |
| Why bech32 replaced base58check | ch04 Bech32 Addresses | Reasoning list | Mixed case hard to read; detects but can't locate errors; bigger QR codes; every wallet upgrade |
| WIF prefixes | ch04 Private Key Formats | Prefix trivia | 5 = WIF; K or L = WIF-compressed (0x01 suffix); "compressed private key" is a misnomer |
| Paper wallets | ch04 Paper Wallets | Emphatic WARNING box | Obsolete and dangerous; use a recovery code and a hardware signing device |
| Vanity addresses are equally secure | ch04 Vanity Addresses | Misconception T/F | Same ECC and hashing; brute-force search; abandoned because deterministic wallets can't import them and reuse hurts privacy |

## Chapter 5: Wallet Recovery

| Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes |
|---|---|---|---|---|---|
| Wallet database holds keys, not bitcoins | ch05 Independent Key Generation | W4 s12 +note (wallets); W4 s29 +note ("Bitcoin doesn't tell you how much you have, but the transactions") | mentioned | high | |
| Nondeterministic (random) keys needed constant backups; single key hurts privacy | ch05 Independent Key Generation | W4 s5, s9 +note (a fresh random key pair per payment) | covered (the lecture's model is this one) | medium | Conflict/nuance: lecture describes independent keys; book says modern wallets derive them. |
| Deterministic key generation from a seed | ch05 Deterministic Key Generation | not mentioned | not covered | high | |
| Public child key derivation (K + tG == (k + t)G); key tweaks; frontend vs hardware signer | ch05 Public Child Key Derivation | not mentioned | not covered | medium | |
| HD wallets (BIP32): tree of keys; default everywhere | ch05 HD Key Generation | not mentioned | not covered | high | |
| Seeds and recovery codes: BIP39, Electrum v2, Aezeed, Muun, SLIP39, Codex32; write it down; passphrase trade-offs | ch05 Seeds and Recovery Codes | W2 s58-60, s97-98 +note (t-of-n threshold signatures: the same t-of-n idea as SLIP39) | not covered (threshold idea only) | high (BIP39 basics), medium (comparisons) | |
| Backing up nonkey data (labels, BIP329, Lightning static channel backups, encrypted backups) | ch05 Backing Up Nonkey Data | not mentioned | not covered | medium | |
| Implicit paths (BIP44/49/84/86) vs explicit paths (descriptors) | ch05 Backing Up Key Derivation Paths | not mentioned | not covered | medium | |
| BIP39: entropy -> checksum -> 11-bit groups -> 2,048 words; 12 words = 128 bits, 24 = 256; PBKDF2 2,048 rounds HMAC-SHA512, salt "mnemonic"+passphrase -> 512-bit seed; no wrong passphrase | ch05 BIP39 Recovery Codes | W2 s16 +note (SHA-256 birthday bound 2^128 = the "128-bit security strength" logic) | not covered | high (12/24 words, no wrong passphrase), medium (PBKDF2 detail) | |
| BIP32: HMAC-SHA512(seed) -> master key + chain code; CKD; extended keys xprv/xpub; xpub on a web store; gap limit | ch05 Creating an HD Wallet from the Seed | not mentioned | not covered | high (xpub can't spend), medium (CKD, gap limit) | |
| Hardened derivation; i' = 2^31 + i; m vs M paths | ch05 Hardened child key derivation; paths | not mentioned | not covered | medium-high | |
| BIP43/BIP44: m/purpose'/coin_type'/account'/change/address_index | ch05 Navigating the HD wallet tree | not mentioned | not covered | high | |
| Data loss is perhaps the leading cause of lost bitcoins | ch05 closing | not mentioned | not covered | medium | |

**Not in the lecture notes but likely on the quiz (chapter 5)**

| Concept | Book section | Why it is likely | One-line answer to know |
|---|---|---|---|
| Wallet holds keys, not coins | ch05 Independent Key Generation | Opening misconception of the chapter | The wallet database contains keys; bitcoins are records on the blockchain |
| Deterministic vs nondeterministic wallets | ch05 Deterministic Key Generation | Core contrast | One seed derives every key (back up once) vs independent random keys (back up after every new key) |
| HD wallet = BIP32 | ch05 HD Key Generation | Acronym MCQ | Hierarchical deterministic tree of keys from one seed; every modern wallet uses it |
| BIP39 words and bits | ch05 Generating a recovery code | Numbers everyone quotes | 2,048-word list, 11 bits per word; 12 words = 128 bits, 24 words = 256 bits |
| BIP39 seed derivation | ch05 From recovery code to seed | Named function | PBKDF2, 2,048 rounds HMAC-SHA512, salt "mnemonic" + passphrase, 512-bit seed |
| No wrong passphrase | ch05 Optional passphrase | Memorable T/F | Every passphrase yields a valid (probably empty) wallet; second factor + duress wallet; loss risk |
| Recovery code vs brainwallet | ch05 BIP39 Recovery Codes TIP | Misconception | Wallet-generated random words vs user-chosen words (insecure) |
| xprv vs xpub | ch05 Extended keys | Definitional | Key + chain code; xprv derives private and public children, xpub public only; xpub on a web server can receive but not spend |
| Hardened derivation and the prime notation | ch05 Hardened child key derivation | Conceptual | Uses the parent private key in the hash so a leaked child key + chain code cannot expose siblings/parent; 0' = 2^31 |
| BIP44 path structure | ch05 Navigating the tree | Formula-like fact | m / 44' / coin_type' (0' BTC, 1' testnet) / account' / change (0 receive, 1 change) / index |
| Gap limit | ch05 Mind the Gap | Named concept | Max consecutive unused addresses a wallet scans past before it stops looking |
| Labels are not restored by a recovery code | ch05 Backing Up Nonkey Data | Ties to ch01 | Labels are local, nondeterministic; BIP329 export; Lightning channel data likewise |

---

## Book vs. lecture: differences a student should know

1. **Bitcoin Core's job.** Lecture (`W4 s13 +note`): "the software to mine bitcoin ... takes a lot of GPUs." Book (ch03): the reference implementation and full-node software (wallet, validation, block-construction tools, P2P); mining today is done by specialized ASIC hardware run by pools. If asked "what is Bitcoin Core", answer *reference implementation / full node*.
2. **Which signature algorithm Bitcoin uses.** Lecture (`W2 s46, s85 +note`): "Bitcoin has moved to the (r, s) version" and "EC-Schnorr multi-signature is what is actually used by bitcoin." Book (ch04): legacy and segwit-v0 outputs use ECDSA signatures (the malleability story), and taproot (segwit v1, bc1p) uses Schnorr. Safe framing: Bitcoin uses elliptic-curve signatures on secp256k1: ECDSA historically, Schnorr since taproot (2021).
3. **Who "proves" the work.** Lecture uses "consensus committee" and never says proof of work in week 4; the book's four innovations name **proof of work** explicitly and describe the hash lottery. Know both vocabularies.
4. **Key generation model.** Lecture (`W4 s5, s9`): a new random key pair per received payment. Book (ch05): the same "fresh address per payment" outcome, but keys are derived deterministically from one seed (BIP32) precisely because independent random keys were a backup nightmare.
5. **Curve provenance.** Lecture: secp256k1 is a **Koblitz curve** with parameters (E, G, p, n). Book: "a standard called secp256k1, established by NIST" (strictly it is a SECG standard; NIST's own curve is P-256, which Bitcoin does not use). Same curve, same equation, same p.
6. **Numbers that moved with time.** Ledger size: lecture 768 GB (2025), book >500 GB (2023). Node counts: lecture ~10K (2020) / 16K (2023), book "thousands". Dates on the whitepaper: `W4 s2` "May 24, 2009" (PDF revision) vs `W4 s57` and the book "2008". Chaum: `W1 s2` says 1982, `W3 s3` says 1988 (1982 = blind signatures idea; 1988 = the untraceable e-cash paper). Answer with the year the question's source uses; for Bitcoin's paper the answer is 2008.
7. **Lecture-only facts not in ch. 1-5.** Max regular TX size 10,000 bytes; TXID = double SHA256 and not stored in the TX; SIGHASH_ALL default among four types; four P2P functions; full node = wallet + miner + blockchain + routing; triple-entry bookkeeping. If a quiz item asks these, use the instructor's values.
8. **Book-only facts not in lectures.** Everything about base58/bech32 encodings, compressed keys, P2SH, WIF, HD wallets (BIP32/39/44), xpub, hardened derivation, Bitcoin Core configuration and RPC. Because this is a reading quiz, chapters 3-5 questions will necessarily come from here.

## If you only have 30 minutes

1. **Transactions (ch02, W4 s17-24):** inputs spend UTXOs (referenced by txid + index) and carry signatures; outputs lock value to the hash of the receiver's public key; **fee = inputs - outputs**, implied, paid to the miner (zero fee = never mined, per lecture); change is just another output back to yourself; miners/nodes check **unspent + valid signature**. Many-in/1-out = consolidation, 1-in/many-out = batching, 1-in/2-out = typical payment. **1 BTC = 100,000,000 satoshi.**
2. **Blocks and confirmations (ch01-02, W4 s10-12, s26):** a block every ~10 minutes on average (difficulty adjusts); miners bundle transactions, are paid new coins + fees only for valid blocks; inclusion = 1 confirmation, each block on top adds one, **>6 = very hard to change**; nodes follow the chain with the most total proof of work; block #0 = genesis.
3. **What Bitcoin is (ch01, W1 s16, W4 s5-6):** decentralized P2P, public ledger of transactions only (no balances, no names), four innovations (P2P network, blockchain, consensus rules, proof of work); solves double spending without a clearinghouse; issuance halves every 4 years toward <21 million; 2008 paper, 2009 launch.
4. **Keys and addresses (ch04, W2 s79-82, W4 s9):** signatures, **not encryption**; private key = random 256-bit number; public key = k x G on **secp256k1** (one-way, discrete log); **address = hash of the public key** (SHA256 then RIPEMD-160 = HASH160, 20 bytes); base58check adds a version byte and a 4-byte double-SHA256 checksum; prefixes 1 (P2PKH), 3 (P2SH), bc1q (segwit v0), bc1p (taproot); segwit 2017 fixed malleability (ECDSA twin signatures).
5. **Wallets (ch05):** a wallet holds keys, not coins; HD wallets (**BIP32**) derive all keys from one seed; **BIP39** turns 128/256 bits of entropy into 12/24 words (2,048-word list) and stretches them with PBKDF2 into a 512-bit seed; there is no wrong passphrase; **xpub** derives receive addresses but cannot spend; hardened derivation (0') protects the parent; **BIP44** path m/44'/0'/0'/change/index.
6. **Bitcoin Core (ch03):** reference implementation and full node (validates every rule; your data is authoritative); JSON-RPC via bitcoin-cli; txindex to look up any transaction; height vs confirmations (depth); a txid is not authoritative until confirmed (malleability).
7. **Skip:** the Silk Road case study (W4 s43-55), compile commands, RPC ports, vanity-address timings, and every formula.
