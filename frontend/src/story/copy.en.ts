import type { StoryCopy } from './copy.ts';

export const storyEn: StoryCopy = {
  ui: {
    backToStart: 'Back to the start',
    skipIntro: 'Skip intro',
    repository: 'Repository',
    backToDemo: '← Back to the demo',
    resetToIntro: '↺ Back to the intro',
    slideOf: (n, total) => `${n} of ${total}`,
    keysHint: 'Use the arrow keys or click to navigate',
    previous: 'Previous',
    next: 'Next',
    startJourney: 'Start the journey',
    behindTheScenes: 'Behind the scenes',
    back: 'Back',
    yourTurn: 'Your turn',
    stepDone: 'Done',
    switchToFree: 'Explore freely',
    switchToTour: 'Guided tour',
    exploreFreely: 'Explore freely',
    seeRecap: 'See the recap',
    showMore: 'Show more',
    showLess: 'Show less',
  },

  art: { store: 'Store', customer: 'Customer', midnight: 'Midnight', market: 'Market', agent: 'AI agent' },

  intro: {
    welcome: {
      kicker: 'Welcome to',
      title: 'Aegis',
      body: 'Every purchase says something about you. Today the product is not what you buy: it is **you**. What if the market could know **what sells** without knowing **who bought it**?',
    },
    disclaimer: {
      title: 'Before we start',
      body: 'This is a **demo** on **Preprod**, the Midnight test network. The store and the products are made up and the signals have no real value. What is real: every step is an **actual transaction**, with a zero-knowledge proof anyone can verify.',
    },
    problem: {
      title: 'Your purchases have an owner, and it is not you',
      body: 'Every purchase, every loyalty card, every click: data brokers and big platforms build **profiles about you** and sell them to the highest bidder. The ones buying them are not small shops, which **compete blind**.',
    },
    idea: {
      title: 'One purchase, one anonymous signal',
      body: '*Aegis* turns every purchase into an **anonymous signal**: only what the customer decides is revealed. Added together, signals **draw the market**; on their own, they say nothing about anyone.',
    },
    players: {
      title: 'Who takes part',
      body: 'Five pieces, each with its own role, and none sees more than it needs.',
      items: [
        { title: 'Store', text: 'Charges and seals the receipt. Proves it is a registered store without saying which one.' },
        { title: 'Customer', text: 'Keeps their receipts on their phone and decides when to publish the signal and what it shows.' },
        { title: 'Midnight', text: 'Runs the contract and verifies the proofs. Keeps the store registry and the public counters.' },
        { title: 'Public market', text: 'Anyone can see what is happening in the market, in real time.' },
        { title: 'AI agent', text: 'Reads only the anonymous signals and writes a personalised report for each store.' },
      ],
    },
    flow: {
      title: 'How a purchase travels',
      body: 'From the store to the market in five steps.',
      steps: [
        'The store charges and seals the receipt: it publishes a commitment and proves, anonymously, that it is in the tree.',
        'The customer gets the receipt as a QR and keeps it on their phone. The full receipt never goes on-chain.',
        'Whenever they want, the customer publishes the signal: a ZK proof that their receipt is sealed and unused. They decide what to reveal.',
        'The contract marks the receipt as used and adds the units to the public data.',
        'The agent reads the public data and summarises the market in real time.',
      ],
    },
    publicPrivate: {
      title: 'What is public and what is not',
      body: 'What anyone can see on-chain, and what never leaves your phone.',
      columns: [
        {
          title: 'Public on Midnight',
          items: [
            'That a registered store sealed a receipt, not which one',
            'The receipt commitment',
            'The information from each receipt that the customer decides to publish',
            'The counters for each category',
          ],
        },
        {
          title: 'Only on your phone',
          items: [
            'The full receipt: products, amount, card, etc.',
            'The store where you bought',
            'Your shopping profile',
            'Ownership of your data',
          ],
        },
      ],
    },
    builtWith: {
      title: 'Built on Midnight',
      body: '*Aegis* uses the Midnight infrastructure so privacy is guaranteed by cryptography, not by a promise.',
    },
    mission: {
      title: 'Your mission in this demo',
      body: 'You will make a purchase in the demo store and turn it into an **anonymous signal**. Along the way you will see what happens behind each step.',
    },
    ready: {
      title: 'Ready to begin?',
      body: 'The guided demo starts with your Midnight wallet and moves on by itself as you complete each step.',
    },
  },

  recap: {
    experienced: {
      title: 'What you just did',
      body: 'You turned a purchase into market data without giving away your data. That is how small shops compete with the big ones and you keep ownership of your information:',
      steps: [
        'You connected your wallet, or used the *Aegis* sponsorship',
        'You checked on Midnight that the store is registered',
        'The store sealed your receipt without saying which one it is',
        'You took the receipt to your phone with a QR',
        'You chose what to share and a ZK proof published the signal',
        'Your signal added to the public figures; the agent only read the whole',
      ],
    },
    beyond: {
      title: 'Beyond commerce',
      body: 'The purchase is just the example. The same idea works wherever you need to **count without watching**: a registered issuer seals a fact and the person decides when to publish it and what to share. Surveys, public transport or event attendance.',
    },
    pieces: {
      title: 'Built on Midnight',
      body: 'What *Aegis* uses from Midnight, and where to read more.',
    },
    start: {
      title: 'Carry on by yourself',
      body: 'The code is open. You can deploy your own contract and try it yourself.',
    },
  },

  stackGroups: ['Midnight', 'Tools'],
  stack: {
    compact: { title: 'Compact', text: 'The contract language: the circuits that prove each step and the public counters.' },
    proofServer: { title: 'Proof server', text: 'Generates the zero-knowledge proofs, at *Aegis* or on your own machine.' },
    disclosure: { title: 'Selective disclosure', text: 'Each customer decides which part of their purchase becomes public; the rest stays on their phone.' },
    indexer: { title: 'Indexer', text: 'Reads the public contract state and follows every transaction live.' },
    dust: { title: 'Sponsored fees', text: 'The resource that pays the fees. Here *Aegis* can pay them for you.' },
    midnightJs: { title: 'Midnight.js', text: 'The SDK used to build, prove and send the transactions.' },
    wallets: { title: 'Lace and 1AM', text: 'Midnight wallets: they sign and pay from the browser with the DApp Connector.' },
  },

  mission: {
    buy: { title: 'Buy', text: 'at the store till' },
    scan: { title: 'Get the receipt', text: 'on your phone, with a QR' },
    choose: { title: 'Choose what to share', text: 'and publish the signal' },
    watch: { title: 'Watch the market', text: 'with your purchase in it' },
  },

  resources: {
    repo: { title: 'Repository', text: 'The *Aegis* code: the contract, the backend and this website.' },
    docs: { title: 'Midnight docs', text: 'Compact, ZK proofs and how to build on Midnight.' },
    contact: { title: 'Get in touch', text: 'alvaro@tricubo.tech' },
  },

  tour: {
    wallet: {
      title: 'Connect your wallet',
      body: 'By default, *Aegis* sponsors every transaction, so you can carry on without connecting anything. But if you prefer an experience that is more your own, connect your wallet and sign each step yourself.\n\nOn a computer, use the **Lace** or **1AM** extension. Whichever you choose, you can then start interacting with the private market of *Aegis*.',
    },
    ribbon: {
      title: 'The market figures',
      body: 'At the top are the market\'s **public figures**: how many signals there are in total and in each category. They live on Midnight and anyone can read and check them.\n\nThey come from what consumers themselves chose to share. Look at the total: in a moment it will include yours.',
    },
    registry: {
      title: 'A registered store',
      body: 'Only registered stores can seal receipts; otherwise anyone could make up purchases. Each store applies to join, and whoever manages the registry reviews the request before accepting it. Once accepted, the store\'s **public key** goes into a **Merkle tree** inside the contract.\n\nThe registry lives on-chain, so anyone can check it.',
      todo: 'Press "Check the store registry"',
    },
    addToCart: {
      title: 'Add something to the basket',
      body: 'Each product has a **category** and a **subcategory**, for example Fashion › Shoes. They are what draws the market, without anyone knowing who bought.',
      todo: 'Add a product to the basket',
    },
    charge: {
      title: 'Charge and seal the receipt',
      body: 'At checkout, the store publishes a **commitment** to the receipt, a fingerprint that reveals nothing of what is inside. With a **ZK proof** it shows it is a registered store **without saying which**.\n\nThe raw receipt never touches the chain. If you have not connected your wallet, you paid no fees: *Aegis* sponsored the transaction in the background so everything flows.',
      todo: 'Press "Charge & generate QR"',
    },
    receipt: {
      title: 'The receipt and its QR',
      body: 'This is the receipt of the purchase, with products, prices and amount. On Midnight there is only its **commitment**.\n\nThe QR carries the whole receipt inside a link, and no server ever sees it. Now you can take your own phone and scan it to live the real flow, or carry on with the demo here.\n\nLater you will be able to choose which information from this receipt you share.',
    },
    ticket: {
      title: 'The receipt, on your phone',
      body: 'This is the *Aegis* app. It keeps the receipts **on your device**: there is no account and no server holding them. The one at the top is the receipt you just created; the rest are earlier purchases.\n\nFrom the receipt you decide whether to publish its signal and what information you share.',
      todo: 'Press "Publish signal" on the new receipt',
    },
    share: {
      title: 'Your data, your decision',
      body: 'The information about your purchase belongs to you. This is **selective disclosure**: you decide what becomes public and what stays with you. Nothing you publish can be linked back to you.\n\nYou will see a clear summary of your selection. You also choose where the proof is generated: at *Aegis* or on your own machine.',
      todo: 'Publish the signal',
    },
    publish: {
      title: 'The proof, under way',
      body: 'A **ZK proof** is generated showing that a registered store sealed your receipt and that it has not been used yet.\n\nMidnight verifies it and marks the receipt to prevent double use. Finally, it adds the units to the market figures.',
      todo: 'Wait for the signal to reach the aggregate',
    },
    market: {
      title: 'Your signal now counts',
      body: 'In a few seconds, your signal will be part of the **public figures**, and the market will draw itself with it. Here you can compare periods and watch the latest signals live.\n\nAnyone can see that one more signal has arrived. Nobody knows it was you.',
    },
    report: {
      title: 'A small store, with the vision of a big one',
      body: 'This is what everything before is for. With a public, real-time market, any store can decide with data instead of blind.\n\nAn **AI agent** reads the market figures and tells each store what is happening: what is rising, what is falling and what to do to sell more. Concrete actions for its business, without any customer having given up their data.\n\nThat way, small shops compete with the big ones and consumers stay the owners of their data.',
    },
    explore: {
      title: 'Now, on your own',
      body: 'You have seen the whole journey. The demo is yours: make more purchases, change what you share, try the local proof server or browse the market.\n\nWhenever you want, the recap sums up everything you saw.',
    },
  },
};
