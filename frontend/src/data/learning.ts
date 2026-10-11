// Educational cards shown in the LearningWidget, translated into all three languages.
import type { Lang } from '../types.ts'

export interface LearningCard { title: string; points: string[]; formula?: string; example?: string }
type Cards = Record<string, LearningCard>

const en: Cards = {
  budget: {
    title: 'The 50/30/20 Budget',
    points: [
      '50% of income for NEEDS — things you cannot live or work without (rent, food, essential tools).',
      '30% for WANTS — nice-to-haves you could skip.',
      '20% for SAVINGS and reserves — your shield against surprises.',
      'It\'s a guide, not a law. When needs exceed 50%, cut wants first and protect savings.',
    ],
    formula: 'Needs ₹11,000 ÷ Income ₹15,000 = 73% → wants must shrink',
  },
  unitprice: {
    title: 'Price per Unit',
    points: ['A bigger total price can still be the better deal.', 'Divide the total price by the quantity to compare fairly.', 'Only buy a bigger pack if you will really use it.'],
    formula: 'Price per unit = Total price ÷ Quantity',
    example: '₹2,000 ÷ 25 flasks = ₹80 per flask',
  },
  deposits: {
    title: 'Savings, RD and FD',
    points: [
      'Savings account: withdraw any time (high liquidity), low interest. Good for daily money and emergencies.',
      'Recurring Deposit (RD): deposit a fixed amount every month for a goal; better interest; withdrawing early may cost a penalty.',
      'Fixed Deposit (FD): lock a lump sum for a term; usually the highest of the three; breaking early may cost a penalty.',
      'Rates used in this game (3%, 6.5%, 7%) are illustrative only. Real rates vary by bank and change over time.',
    ],
    formula: 'FD maturity (annual compounding) = P × (1 + r)ⁿ',
    example: '₹50,000 at 7% for 2 years ≈ ₹57,245',
  },
  payments: {
    title: 'Cards, UPI & Staying Safe',
    points: [
      'Debit card: spends your own bank balance. Credit card: borrowed money — pay the full bill on time to avoid high interest.',
      'UPI PIN authorises money LEAVING your account. You never need a PIN to RECEIVE money.',
      'Never share OTPs, PINs, passwords, or install screen-sharing apps on a stranger\'s request.',
      'Red flags: urgency, prizes you never entered, unknown links, "KYC expiring", requests to "refund" money you never saw arrive.',
    ],
    formula: 'Receiving money = no PIN, no OTP, no app install',
  },
  interest: {
    title: 'Monthly vs Annual Interest',
    points: [
      'Nominal annual rate = monthly rate × 12. 5% a month → 60% "per year".',
      'Effective annual rate includes compounding: interest earns interest. 5% a month → 79.6% per year.',
      'Productive borrowing buys something that earns more than it costs. Harmful borrowing funds consumption at high interest.',
      'Always compare loans using the same measure (effective annual rate, total repaid).',
    ],
    formula: 'Effective annual rate = (1 + monthly rate)¹² − 1',
    example: '(1.05)¹² − 1 = 0.7959 → 79.6%',
  },
  credit: {
    title: 'EMI & Credit Score',
    points: [
      'EMI (Equated Monthly Instalment) = fixed monthly payment covering interest + principal.',
      'A credit score (e.g. CIBIL, 300–900) reflects repayment history, credit utilisation, credit mix and recent enquiries.',
      'Paying on time builds your score; missed payments damage it most.',
      'Keep total EMIs at or below about 30% of income (EMI-to-income ratio).',
      'This game uses a simple teaching model, not the official CIBIL formula.',
    ],
    formula: 'EMI = P·r·(1+r)ⁿ ÷ ((1+r)ⁿ − 1)',
    example: '₹14,000 at 1%/month for 12 months → ₹1,243.88',
  },
  investing: {
    title: 'Shares, Funds & P/E',
    points: [
      'A share is part-ownership of a company. Mutual funds pool many investors\' money; index ETFs track an index like the NIFTY 50.',
      'SEBI (Securities and Exchange Board of India) regulates markets to protect investors. It does not guarantee returns.',
      'EPS = net profit ÷ number of shares. P/E = share price ÷ EPS.',
      'A loss-making company has negative EPS, so its P/E is not meaningful.',
      'P/E is one clue among many: growth, debt, quality and risk all matter.',
    ],
    formula: 'P/E = Share price ÷ EPS',
  },
  diversification: {
    title: 'Diversification & Market Cycles',
    points: [
      'Spreading money across assets (index funds, stocks, gold) reduces the damage any single one can do.',
      'Markets rise and fall. Selling in panic after a fall locks in the loss.',
      'Rebalancing returns your mix to its targets — selling some of what rose, buying some of what fell.',
      'Fees quietly reduce returns every year.',
      'No investment is guaranteed to recover or to beat cash. The simulation uses fixed teaching assumptions.',
    ],
  },
  inflation: {
    title: 'Inflation & the Rule of 72',
    points: [
      'Inflation means prices rise, so each rupee buys less: purchasing power falls.',
      'Real return ≈ nominal return − inflation. 6% FD with 6% inflation ≈ 0% real growth.',
      'Rule of 72: years to double ≈ 72 ÷ annual rate. It is an approximation — most accurate around 6–10%.',
      'It works both ways: at 6% inflation, prices double (your money\'s value halves) in about 12 years.',
    ],
    formula: 'Years to double ≈ 72 ÷ rate%   ·   Real = (1+n)/(1+i) − 1',
  },
  shields: {
    title: 'Risk Shields',
    points: [
      'Emergency fund: cash for job loss, repairs or medical bills. A common guideline is 3–6 months of essential expenses, kept liquid.',
      'Insurance transfers specific big risks (like hospital bills) to an insurer for a premium — subject to policy terms, limits and exclusions.',
      'Insurance is not a substitute for emergency savings: you still need cash for co-pays, waiting periods and non-covered events.',
      'Build the shield before chasing high returns.',
    ],
  },
}

const te: Cards = {
  budget: { title: '50/30/20 బడ్జెట్', points: ['ఆదాయంలో 50% అవసరాలకు — అద్దె, ఆహారం, ముఖ్యమైన పనిముట్లు.', '30% కోరికలకు — లేకపోయినా బతకగలిగేవి.', '20% పొదుపు, రిజర్వ్‌కు — అనుకోని ఖర్చులకు రక్షణ.', 'ఇది మార్గదర్శి మాత్రమే. అవసరాలు 50% దాటితే, ముందు కోరికలను తగ్గించి పొదుపును కాపాడండి.'], formula: 'అవసరాలు ₹11,000 ÷ ఆదాయం ₹15,000 = 73% → కోరికలు తగ్గాలి' },
  unitprice: { title: 'యూనిట్ ధర', points: ['పెద్ద మొత్తం ధర ఉన్నా అది మంచి డీల్ కావచ్చు.', 'న్యాయంగా పోల్చడానికి మొత్తం ధరను పరిమాణంతో భాగించండి.', 'నిజంగా వాడేటప్పుడే పెద్ద ప్యాక్ కొనండి.'], formula: 'యూనిట్ ధర = మొత్తం ధర ÷ పరిమాణం', example: '₹2,000 ÷ 25 సీసాలు = సీసాకు ₹80' },
  deposits: { title: 'సేవింగ్స్, RD మరియు FD', points: ['సేవింగ్స్ ఖాతా: ఎప్పుడైనా తీసుకోవచ్చు (అధిక లిక్విడిటీ), తక్కువ వడ్డీ. రోజువారీ డబ్బుకు, అత్యవసరాలకు మంచిది.', 'రికరింగ్ డిపాజిట్ (RD): లక్ష్యం కోసం ప్రతి నెలా స్థిర మొత్తం; మెరుగైన వడ్డీ; ముందే తీస్తే జరిమానా ఉండవచ్చు.', 'ఫిక్స్‌డ్ డిపాజిట్ (FD): ఒకేసారి మొత్తాన్ని నిర్ణీత కాలానికి లాక్ చేయడం; సాధారణంగా ఎక్కువ వడ్డీ; ముందే తీస్తే జరిమానా.', 'ఈ ఆటలోని రేట్లు (3%, 6.5%, 7%) ఉదాహరణలు మాత్రమే. నిజమైన రేట్లు బ్యాంకును బట్టి మారుతాయి.'], formula: 'FD మెచ్యూరిటీ = P × (1 + r)ⁿ', example: '₹50,000 7% వద్ద 2 సంవత్సరాలు ≈ ₹57,245' },
  payments: { title: 'కార్డులు, UPI & భద్రత', points: ['డెబిట్ కార్డ్: మీ సొంత బ్యాలెన్స్. క్రెడిట్ కార్డ్: అప్పు — అధిక వడ్డీ నివారించడానికి పూర్తి బిల్లును సమయానికి చెల్లించండి.', 'UPI PIN మీ ఖాతా నుండి డబ్బు బయటకు వెళ్ళడానికి అనుమతిస్తుంది. డబ్బు పొందడానికి PIN ఎప్పుడూ అవసరం లేదు.', 'అపరిచితుల కోరికపై OTP, PIN, పాస్‌వర్డ్‌లు పంచుకోవద్దు, స్క్రీన్-షేరింగ్ యాప్‌లు ఇన్‌స్టాల్ చేయవద్దు.', 'ప్రమాద సంకేతాలు: తొందర, మీరు పాల్గొనని బహుమతులు, తెలియని లింకులు, "KYC గడువు", రాని డబ్బును "తిరిగి ఇవ్వమని" అడగడం.'], formula: 'డబ్బు పొందడం = PIN లేదు, OTP లేదు, యాప్ లేదు' },
  interest: { title: 'నెలవారీ vs వార్షిక వడ్డీ', points: ['నామమాత్ర వార్షిక రేటు = నెలవారీ రేటు × 12. నెలకు 5% → "సంవత్సరానికి" 60%.', 'ప్రభావవంతమైన వార్షిక రేటు చక్రవడ్డీని కలుపుతుంది: వడ్డీపై వడ్డీ. నెలకు 5% → సంవత్సరానికి 79.6%.', 'ఉత్పాదక అప్పు ఖర్చు కంటే ఎక్కువ సంపాదించేదాన్ని కొంటుంది. హానికర అప్పు అధిక వడ్డీతో వినియోగానికి వాడుతుంది.', 'రుణాలను ఎప్పుడూ ఒకే కొలమానంతో పోల్చండి (ప్రభావవంతమైన రేటు, మొత్తం చెల్లింపు).'], formula: 'ప్రభావవంతమైన రేటు = (1 + నెలవారీ రేటు)¹² − 1', example: '(1.05)¹² − 1 = 0.7959 → 79.6%' },
  credit: { title: 'EMI & క్రెడిట్ స్కోర్', points: ['EMI = వడ్డీ + అసలు కలిపిన స్థిర నెలవారీ చెల్లింపు.', 'క్రెడిట్ స్కోర్ (ఉదా. CIBIL, 300–900) తిరిగి చెల్లింపు చరిత్ర, క్రెడిట్ వినియోగం, ఇటీవలి విచారణలను ప్రతిబింబిస్తుంది.', 'సమయానికి చెల్లిస్తే స్కోర్ పెరుగుతుంది; చెల్లింపులు తప్పితే ఎక్కువ నష్టం.', 'మొత్తం EMIలను ఆదాయంలో సుమారు 30% లోపు ఉంచండి.', 'ఈ ఆట సరళమైన బోధనా నమూనాను వాడుతుంది, అధికారిక CIBIL ఫార్ములా కాదు.'], formula: 'EMI = P·r·(1+r)ⁿ ÷ ((1+r)ⁿ − 1)', example: '₹14,000, నెలకు 1%, 12 నెలలు → ₹1,243.88' },
  investing: { title: 'షేర్లు, ఫండ్లు & P/E', points: ['షేర్ అంటే కంపెనీలో భాగస్వామ్యం. మ్యూచువల్ ఫండ్లు చాలా మంది డబ్బును కలుపుతాయి; ఇండెక్స్ ETFలు NIFTY 50 వంటి సూచీని అనుసరిస్తాయి.', 'SEBI పెట్టుబడిదారులను కాపాడటానికి మార్కెట్లను నియంత్రిస్తుంది. రాబడికి హామీ ఇవ్వదు.', 'EPS = నికర లాభం ÷ షేర్ల సంఖ్య. P/E = షేర్ ధర ÷ EPS.', 'నష్టంలో ఉన్న కంపెనీకి EPS ప్రతికూలం, కాబట్టి దాని P/E అర్థరహితం.', 'P/E ఒక సూచన మాత్రమే: వృద్ధి, అప్పు, నాణ్యత, రిస్క్ కూడా ముఖ్యం.'], formula: 'P/E = షేర్ ధర ÷ EPS' },
  diversification: { title: 'వైవిధ్యీకరణ & మార్కెట్ చక్రాలు', points: ['డబ్బును వేర్వేరు ఆస్తుల్లో (ఇండెక్స్ ఫండ్లు, షేర్లు, బంగారం) పంచడం ఒక్కదాని నష్టాన్ని తగ్గిస్తుంది.', 'మార్కెట్లు పెరుగుతాయి, పడతాయి. పతనం తర్వాత భయంతో అమ్మితే నష్టం స్థిరమవుతుంది.', 'రీబ్యాలెన్సింగ్ మీ మిశ్రమాన్ని లక్ష్యానికి తిరిగి తెస్తుంది.', 'ఫీజులు ప్రతి సంవత్సరం నిశ్శబ్దంగా రాబడిని తగ్గిస్తాయి.', 'ఏ పెట్టుబడికీ కోలుకుంటుందని లేదా నగదు కంటే ఎక్కువ ఇస్తుందని హామీ లేదు.'] },
  inflation: { title: 'ద్రవ్యోల్బణం & 72 నియమం', points: ['ద్రవ్యోల్బణం అంటే ధరలు పెరగడం, కాబట్టి ప్రతి రూపాయి తక్కువ కొంటుంది: కొనుగోలు శక్తి తగ్గుతుంది.', 'నిజమైన రాబడి ≈ నామమాత్ర రాబడి − ద్రవ్యోల్బణం. 6% FD, 6% ద్రవ్యోల్బణం ≈ 0% నిజమైన వృద్ధి.', '72 నియమం: రెట్టింపు కావడానికి సంవత్సరాలు ≈ 72 ÷ రేటు. ఇది అంచనా మాత్రమే.', '6% ద్రవ్యోల్బణంతో ధరలు సుమారు 12 సంవత్సరాల్లో రెట్టింపు అవుతాయి.'], formula: 'రెట్టింపు ≈ 72 ÷ రేటు%  ·  నిజమైనది = (1+n)/(1+i) − 1' },
  shields: { title: 'రిస్క్ కవచాలు', points: ['అత్యవసర నిధి: ఉద్యోగ నష్టం, మరమ్మతులు, వైద్య బిల్లులకు నగదు. సాధారణ మార్గదర్శి 3–6 నెలల అవసర ఖర్చులు.', 'బీమా నిర్దిష్ట పెద్ద రిస్క్‌లను ప్రీమియంకు బీమా సంస్థకు బదిలీ చేస్తుంది — పాలసీ నిబంధనలకు లోబడి.', 'బీమా అత్యవసర పొదుపుకు ప్రత్యామ్నాయం కాదు: కో-పే, వెయిటింగ్ పీరియడ్‌లకు నగదు కావాలి.', 'అధిక రాబడి వెంట పడే ముందు కవచం నిర్మించండి.'] },
}

const hi: Cards = {
  budget: { title: '50/30/20 बजट', points: ['आय का 50% ज़रूरतों पर — किराया, खाना, ज़रूरी औज़ार।', '30% चाहतों पर — जिनके बिना भी काम चल जाए।', '20% बचत और रिज़र्व पर — अचानक खर्चों से सुरक्षा।', 'यह मार्गदर्शक है, कानून नहीं। ज़रूरतें 50% से ज़्यादा हों तो पहले चाहतें घटाएँ और बचत बचाएँ।'], formula: 'ज़रूरतें ₹11,000 ÷ आय ₹15,000 = 73% → चाहतें घटें' },
  unitprice: { title: 'प्रति यूनिट कीमत', points: ['बड़ी कुल कीमत भी बेहतर सौदा हो सकती है।', 'सही तुलना के लिए कुल कीमत को मात्रा से भाग दें।', 'बड़ा पैक तभी लें जब सच में इस्तेमाल करें।'], formula: 'प्रति यूनिट कीमत = कुल कीमत ÷ मात्रा', example: '₹2,000 ÷ 25 शीशी = ₹80 प्रति शीशी' },
  deposits: { title: 'बचत, RD और FD', points: ['बचत खाता: कभी भी निकालें (ऊँची तरलता), कम ब्याज। रोज़मर्रा और आपात के लिए अच्छा।', 'रेकरिंग डिपॉज़िट (RD): लक्ष्य के लिए हर महीने तय रकम; बेहतर ब्याज; जल्दी निकालने पर जुर्माना हो सकता है।', 'फ़िक्स्ड डिपॉज़िट (FD): एकमुश्त रकम तय अवधि के लिए; आम तौर पर सबसे ज़्यादा ब्याज; जल्दी तोड़ने पर जुर्माना।', 'इस खेल की दरें (3%, 6.5%, 7%) केवल उदाहरण हैं। असली दरें बैंक के अनुसार बदलती हैं।'], formula: 'FD परिपक्वता = P × (1 + r)ⁿ', example: '₹50,000, 7% पर 2 साल ≈ ₹57,245' },
  payments: { title: 'कार्ड, UPI और सुरक्षा', points: ['डेबिट कार्ड: आपका अपना बैलेंस। क्रेडिट कार्ड: उधार — भारी ब्याज से बचने के लिए पूरा बिल समय पर चुकाएँ।', 'UPI PIN आपके खाते से पैसा बाहर जाने की अनुमति देता है। पैसे पाने के लिए PIN कभी नहीं चाहिए।', 'किसी अजनबी के कहने पर OTP, PIN, पासवर्ड न दें, न स्क्रीन-शेयरिंग ऐप इंस्टॉल करें।', 'खतरे के संकेत: जल्दबाज़ी, बिना भाग लिए इनाम, अनजान लिंक, "KYC खत्म", जो पैसा आया ही नहीं उसे "लौटाने" की माँग।'], formula: 'पैसा पाना = न PIN, न OTP, न ऐप' },
  interest: { title: 'मासिक बनाम वार्षिक ब्याज', points: ['नाममात्र वार्षिक दर = मासिक दर × 12। 5% मासिक → "सालाना" 60%।', 'प्रभावी वार्षिक दर में चक्रवृद्धि शामिल है: ब्याज पर ब्याज। 5% मासिक → सालाना 79.6%।', 'उत्पादक कर्ज़ ऐसी चीज़ खरीदता है जो लागत से ज़्यादा कमाए। हानिकारक कर्ज़ ऊँचे ब्याज पर उपभोग कराता है।', 'ऋणों की तुलना हमेशा एक ही पैमाने (प्रभावी दर, कुल भुगतान) से करें।'], formula: 'प्रभावी दर = (1 + मासिक दर)¹² − 1', example: '(1.05)¹² − 1 = 0.7959 → 79.6%' },
  credit: { title: 'EMI और क्रेडिट स्कोर', points: ['EMI = ब्याज + मूलधन मिलाकर तय मासिक किस्त।', 'क्रेडिट स्कोर (जैसे CIBIL, 300–900) भुगतान इतिहास, क्रेडिट उपयोग और हाल की पूछताछ दर्शाता है।', 'समय पर भुगतान स्कोर बढ़ाता है; चूके भुगतान सबसे ज़्यादा नुकसान करते हैं।', 'कुल EMI आय के लगभग 30% के भीतर रखें।', 'यह खेल सरल शिक्षण मॉडल उपयोग करता है, आधिकारिक CIBIL फ़ॉर्मूला नहीं।'], formula: 'EMI = P·r·(1+r)ⁿ ÷ ((1+r)ⁿ − 1)', example: '₹14,000, 1% मासिक, 12 महीने → ₹1,243.88' },
  investing: { title: 'शेयर, फ़ंड और P/E', points: ['शेयर यानी कंपनी में हिस्सेदारी। म्यूचुअल फ़ंड कई निवेशकों का पैसा जोड़ते हैं; इंडेक्स ETF NIFTY 50 जैसे सूचकांक को ट्रैक करते हैं।', 'SEBI निवेशकों की सुरक्षा के लिए बाज़ार का नियमन करता है। यह रिटर्न की गारंटी नहीं देता।', 'EPS = शुद्ध लाभ ÷ शेयरों की संख्या। P/E = शेयर कीमत ÷ EPS।', 'घाटे वाली कंपनी का EPS ऋणात्मक होता है, इसलिए उसका P/E अर्थहीन है।', 'P/E सिर्फ़ एक सुराग है: वृद्धि, कर्ज़, गुणवत्ता और जोखिम भी मायने रखते हैं।'], formula: 'P/E = शेयर कीमत ÷ EPS' },
  diversification: { title: 'विविधीकरण और बाज़ार चक्र', points: ['पैसा अलग-अलग संपत्तियों (इंडेक्स फ़ंड, शेयर, सोना) में बाँटने से किसी एक का नुकसान घटता है।', 'बाज़ार चढ़ते-गिरते हैं। गिरावट के बाद घबराकर बेचना नुकसान पक्का कर देता है।', 'पुनर्संतुलन आपके मिश्रण को लक्ष्य पर वापस लाता है।', 'फ़ीस हर साल चुपचाप रिटर्न घटाती है।', 'कोई निवेश वापस उभरने या नकद से बेहतर देने की गारंटी नहीं देता।'] },
  inflation: { title: 'महँगाई और 72 का नियम', points: ['महँगाई यानी कीमतें बढ़ना, इसलिए हर रुपया कम खरीदता है: क्रय शक्ति घटती है।', 'वास्तविक रिटर्न ≈ नाममात्र रिटर्न − महँगाई। 6% FD और 6% महँगाई ≈ 0% वास्तविक वृद्धि।', '72 का नियम: दोगुना होने के साल ≈ 72 ÷ दर। यह अनुमान है।', '6% महँगाई पर कीमतें लगभग 12 साल में दोगुनी हो जाती हैं।'], formula: 'दोगुना ≈ 72 ÷ दर%  ·  वास्तविक = (1+n)/(1+i) − 1' },
  shields: { title: 'जोखिम कवच', points: ['आपात निधि: नौकरी जाने, मरम्मत या इलाज के लिए नकद। आम दिशानिर्देश: 3–6 महीने के ज़रूरी खर्च।', 'बीमा प्रीमियम के बदले खास बड़े जोखिम बीमा कंपनी को देता है — पॉलिसी शर्तों के अधीन।', 'बीमा आपात बचत का विकल्प नहीं: को-पे और प्रतीक्षा अवधि के लिए नकद चाहिए।', 'ऊँचे रिटर्न के पीछे भागने से पहले कवच बनाएँ।'] },
}

export const LEARNING: Record<Lang, Cards> = { en, te, hi }
