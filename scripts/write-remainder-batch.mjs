import fs from "node:fs";

const FOOTER =
  "#RepentanceProject #PrayerTopics #LivingWordMap #RR2026 #Deliverance #SpiritualWarfare #Principalities #Repentance https://map.repentance101.com";
const STAR = "https://mtfamilyfellowship.com/";
const START_MS = Date.parse("2026-09-13T14:21:48.000Z");
const STEP = 864000;

const items = [
  {
    type: "SEGMENT",
    editId: "6aa2dcccfd161b184fba7bb1",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dcccfd161b184fba7bb1/preview?review-token=HFw_tsJ4M1LCNd58iCoVxGeZ5ytk8R6WWbOVD5IOoyE",
    hasStar: true,
    title: "Teach Them to Obey: How Jesus Makes Disciples",
    ytTags: " #MakeDisciples #GreatCommission #Obedience",
    summary:
      "Jesus defined discipleship in one sentence: go, baptize, and teach them to obey everything He commanded. Real discipleship is not a six-year curriculum or a purchased workbook; it is quickly laying a foundation of obedience so a new believer can grow.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcccfd161b184fba7b70",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dcccfd161b184fba7b70/preview?review-token=BvLn-E3dFF1ABQPksP-hVte9p2dtXEnDybPKFe6XSP0",
    hasStar: false,
    title: "Masturbation, Spirit Spouses, and Bestiality",
    ytTags: " #SpiritSpouse #SexualPurity #Deliverance",
    summary:
      "Masturbation is not holy procreation; it opens a spiritual counterfeit that feeds spirit-spouse bondage and dopamine addiction. Bestiality is Nephilim worship in practice, pursuing hybrid corruption instead of God's design for covenant intimacy.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcccfd161b184fba7b6a",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dcccfd161b184fba7b6a/preview?review-token=F0kMzsQkulT6BkLloz8KBq8evj4gcUkxSsJBc1tLvu4",
    hasStar: true,
    title: "Do Not Swear: Let Your Yes Be Yes",
    ytTags: " #LetYourYesBeYes #IdleWords #Integrity",
    summary:
      "Jesus said do not swear at all: if you never swear, you never swear falsely. Mean what you say. Broken vows teach children that words are empty, and every idle word will be accounted for on the day of judgment.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcccfd161b184fba7b64",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dcccfd161b184fba7b64/preview?review-token=gH-dHBEy1r39dnqpIH7BGsSpe9joD22cu5-ceimi6C8",
    hasStar: true,
    title: "Do Not Resist an Evil Person",
    ytTags: " #TurnTheOtherCheek #SermonOnTheMount #KingdomEthics",
    summary:
      "Jesus shocks the old eye-for-eye order: do not resist an evil person, turn the other cheek, go the second mile, and give to the one who asks. This is not weakness; it is the new kingdom interrupting revenge with costly love.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcccfd161b184fba7b1a",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dcccfd161b184fba7b1a/preview?review-token=BFcWk8gWf5Ppk1aVc95qyG_yQF96G7o8DjgF0dCun04",
    hasStar: true,
    title: "Hurt People Hurt People",
    ytTags: " #HurtPeopleHurtPeople #Forgiveness #LoveYourEnemies",
    summary:
      "The Greek for evil can also mean hurtful: wounded people wound people. Countering a lawsuit or insult with more force continues the cycle; answering with love stops hatred in its tracks and becomes a public testimony of Christ.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcbc652a890063c74084",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dcbc652a890063c74084/preview?review-token=bUBi957DGgQnU9O9DvwwP6N15knnAA0q82mUNbxs8f4",
    hasStar: false,
    title: "What God Will Not Tolerate About BDSM",
    ytTags: " #BDSM #SexualCorruption #TrueLove",
    summary:
      "BDSM sits under sexual perversion as counterfeit intimacy, counterfeit power, and counterfeit covenant. God will not bless a practice that trains the body that pain, humiliation, and domination are the path to closeness. Consent is not a substitute for holiness.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcbc652a890063c7407a",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dcbc652a890063c7407a/preview?review-token=BPk-q_YrVdAiXCnmhBu5uB1QPcRwCl1fnaQC3ks36EY",
    hasStar: true,
    title: "Love Your Enemies: Becoming Mature Sons",
    ytTags: " #LoveYourEnemies #SermonOnTheMount #SpiritualMaturity",
    summary:
      "You have heard, love your neighbor and hate your enemy. Jesus establishes new wine: bless those who curse you, do good to those who hate you, and pray for those who persecute you, that you may be mature sons of your Father in heaven.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcbc652a890063c74056",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dcbc652a890063c74056/preview?review-token=HA4f4pS52CgySoLTcY8cemOk6SIfuSjU5wjrD_Hc0kA",
    hasStar: false,
    title: "Misogyny, Misandry, and Social Consumption",
    ytTags: " #Misogyny #Misandry #ImageOfGod",
    summary:
      "Misogyny and misandry claim justice or desire while turning men and women into objects of lust. That culture is social consumption, not building. In God's economy the people who truly live are those who repent and come out, not those who become best at the game.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcbc652a890063c74050",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dcbc652a890063c74050/preview?review-token=QcQrmGz9qCne0n_3TcW4ZZFZBhFBGzgltdliX9775g8",
    hasStar: true,
    title: "The First Command of Jesus: Repent",
    ytTags: " #Repent #Matthew417 #FollowMe",
    summary:
      "The first word Jesus preached was repent, for the kingdom of heaven is at hand. Repentance is a 180-degree turn: forsake the old way and follow Him. Then comes the second command: follow Me, and I will make you fishers of men.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dcbc652a890063c7401a",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dcbc652a890063c7401a/preview?review-token=TC-CsZyT-T4nLD3a9WQLVnVwF0l7Obh_jGsFX6uYbgg",
    hasStar: true,
    title: "Love God, Love Neighbor, Love Your Enemy",
    ytTags: " #GreatestCommandment #LoveYourEnemies #Koinonia",
    summary:
      "Loving only those who love you is what tax collectors already do. On loving God and loving your neighbor hang all the Law and the Prophets, and Jesus presses it further: love your enemy, that you may resemble your Father who sends rain on just and unjust.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b2e7",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b2e7/preview?review-token=UcPUOCPVVp6wJmxCLTp1WL8z-ER0yNHHhV-qUeOdWzA",
    hasStar: false,
    title: "Party Spirit vs Kingdom Citizenship",
    ytTags: " #PartySpirit #KingdomCitizenship #BiblicalValues",
    summary:
      "A party spirit decides every issue by political tribe. Philippians 3:20 calls believers heaven's politicians: ambassadors who represent earth to heaven and heaven to earth. Vote values and godly character, not a team's colors.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b2de",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b2de/preview?review-token=mfXB_JvkikAmRkGPOFhpEWnxGyJ4dgo74xdiTxMhO_g",
    hasStar: false,
    title: "The Age of Accountability",
    ytTags: " #AgeOfAccountability #ChooseChrist #MoralResponsibility",
    summary:
      "The age of accountability is the moment a child or young adult consciously chooses whether to live knowing Jesus is the Son of God, or to go their own way. After that choice, they stand personally responsible before God.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b2d5",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b2d5/preview?review-token=WHGxRIaRbmIIPDGfY0MdP5I1FHq2jtz7w5eLHq69fLM",
    hasStar: true,
    title: "Flee Sexual Immorality: Run in Terror",
    ytTags: " #FleeImmorality #1Corinthians618 #Pornography",
    summary:
      "Scripture almost never tells Christians to run in stark terror except here: flee sexual immorality. For some the bondage is not drink or theft but lust and pornography. After salvation, that material has to go; you cannot hang around it and stay free.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b2cf",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b2cf/preview?review-token=WYpnyh9tl81rtaQQvoRfZg-B2zIqYXdjex99cFbm1qQ",
    hasStar: true,
    title: "Do What It Takes to Flee Lust",
    ytTags: " #FleeLust #SexualPurity #TempleOfTheHolySpirit",
    summary:
      "Jesus is radical: gouge out the eye, cut off the hand, flee. Sexual immorality sins against your own body and dismantles character and destiny. Do not put yourself in the place of temptation. Put filters on. Your body is not your own.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b2ab",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b2ab/preview?review-token=58y5WMz8bSAodkGWCCv660loSSEL-cFHWjjx671BvS0",
    hasStar: true,
    title: "Pure Heart, Pure Mind, Pure Eyes",
    ytTags: " #HeartPurity #Matthew5 #AdulteryOfTheHeart",
    summary:
      "If your hand causes you to sin, cut it off. Jesus is not lowering the sixth commandment; He is taking it to the inner man: lust in the mind is already adultery. Guard a pure heart, a pure mind, and pure eyes, including among ministers.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b2a5",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b2a5/preview?review-token=roi7u9ZDlA7IKgdj7RaeD1K2KJzKUXbG7xfGvkHPPL0",
    hasStar: true,
    title: "One Flesh: Hollywood vs Covenant",
    ytTags: " #OneFlesh #CovenantMarriage #SexualOneness",
    summary:
      "Hollywood treats sexual intimacy like a handshake. Scripture says the two become one flesh: soul and spirit join. What is in them can transfer to you. Teach your children that casual sex is a covenant they cannot later pretend never happened.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b29f",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b29f/preview?review-token=LqYeyFMuzE7OIGuglwePYNmhh6Yfi7wdtpYy_FoGz9g",
    hasStar: true,
    title: "Accelerated Discipleship at the Kitchen Table",
    ytTags: " #Discipleship #ApostolicHub #GreatCommission",
    summary:
      "If discipleship is one hour on Sunday, the church is in trouble. Teaching them to obey happens around kitchen tables and living rooms, more than one day a week. The kingdom increases when we stop assuming the building model will finish the job.",
  },
  {
    type: "SEGMENT",
    editId: "6aa2dc6e7b77ac7999b8b213",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dc6e7b77ac7999b8b213/preview?review-token=QAD8rpsbMbv5kNn-GzoNPyf_5MKukLk6bZqEz-Grsb0",
    hasStar: false,
    title: "Fearing Man Rather Than God",
    ytTags: " #FearOfMan #FearOfGod #Idolatry",
    extraAfterSummary: [
      "@Weneed2talktv",
      "Fearing Man means you respond to what a man says, not to what the man said God said",
    ],
    summary:
      "Fearing man is people-focus instead of God-focus, and it is idolatry: you become more concerned with what a person can do to you than what God can do. Men are inconsistent; God is not. Judgment will measure how often we preferred human opinion over His word.",
  },
  {
    type: "SHORT",
    editId: "6aa2dde54424bcf4564a137b",
    url: "https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dde54424bcf4564a137b/preview?review-token=FmsFeYFHNBuz_bcm54glEXFEvuVmSakHhftfxoUspKA",
    hasStar: false,
    title: "Trained to Be a Doormat",
    ytTags: " #DoormatCulture #HealthyBoundaries #FreedomInChrist",
    igTags:
      " #DoormatCulture #HealthyBoundaries #FreedomInChrist #ForcedServitude #PeoplePleasing #NoMoreSlavery #PersonalBoundaries #ChristianHealing #InnerHealing #Deliverance #Repentance #Truth #SelfRespect #IdentityInChrist #SpiritualWarfare #Jesus #Faith #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Saying yes to everything and dealing with the fallout later is not humility; it is training to lie and to live without boundaries. Forced servitude is slavery. Christ does not require you to believe you should never be respected.",
  },
  {
    type: "SHORT",
    editId: "6aa2dde54424bcf4564a1375",
    url: "https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dde54424bcf4564a1375/preview?review-token=FvQ34-HKZWt9aDHoFTMHYjr0_VJRPdBk98dbAizEyIQ",
    hasStar: false,
    title: "Unforgiveness Is Battery Acid",
    ytTags: " #Forgiveness #InnerHealing #LetGoOfOffense",
    igTags:
      " #Forgiveness #InnerHealing #LetGoOfOffense #BatteryAcid #Bitterness #HealingTrauma #ChooseToForgive #FreedomInChrist #HolySpirit #Grace #Repentance #Deliverance #ChristianLiving #LoveYourEnemies #Jesus #Faith #SpiritualWarfare #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Unforgiveness is like drinking battery acid and hoping it hurts the person you are mad at. Ask the Lord to help you forgive when you cannot feel it yet. When He does, love can remain and the relationship can live.",
  },
  {
    type: "SHORT",
    editId: "6aa2dde54424bcf4564a1364",
    url: "https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dde54424bcf4564a1364/preview?review-token=b0Lt8MK6C57_tgElj9ncnA-zXv3Fd1NNG2o4Z45MJHw",
    hasStar: false,
    title: "I Saw People as Objects",
    ytTags: " #Objectification #CompulsiveDesire #Deliverance",
    igTags:
      " #Objectification #CompulsiveDesire #Deliverance #ImageOfGod #SexualPurity #MindRenewal #AddictionRecovery #InnerHealing #Repentance #FreedomInChrist #Truth #Lust #Sanctification #JesusSaves #Faith #SpiritualWarfare #ChristianLiving #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Compulsive desire trained a man from childhood to see women as objects to be used, not people made in God's image. Obesity, binge eating, and lust all grow from believing lies. Freedom begins when you admit your way was not God's way.",
  },
  {
    type: "SHORT",
    editId: "6aa2dde54424bcf4564a1342",
    url: "https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dde54424bcf4564a1342/preview?review-token=RB0odHP4NeY1RswQVs--Qn--pW0S50trPODpsNeP4Ps",
    hasStar: true,
    title: "You Will Want to Pray",
    ytTags: " #Prayer #SpiritualAuthority #PrayerLife",
    igTags:
      " #Prayer #SpiritualAuthority #PrayerLife #DailyPrayer #HabitOfPrayer #KingdomAuthority #Intercession #Faith #ChristianLiving #SpiritualDiscipline #Jesus #Christ #Repentance #Deliverance #Lordship #HolySpirit #PowerOfPrayer #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Most people know they ought to pray and still do not. When you find the authority, the power, and what prayer actually accomplishes, it stops being a religious calisthenic. You will want to pray because you finally know what you walk in.",
    overlapNote: "Shorter cut overlapping Discovering Prayer's Power from the earlier batch.",
  },
  {
    type: "SHORT",
    editId: "6aa2dde54424bcf4564a133b",
    url: "https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dde54424bcf4564a133b/preview?review-token=JJAk6wwdUXqCBFaEpsUE-biN0c8FdCAJahPDvMO7h3E",
    hasStar: true,
    title: "If You Do Not Forgive, He Will Not",
    ytTags: " #Matthew6 #Forgiveness #Unforgiveness",
    igTags:
      " #Matthew6 #Forgiveness #Unforgiveness #LordsPrayer #InnerHealing #Bitterness #Grace #Mercy #Repentance #Jesus #Faith #ChristianLiving #Deliverance #FreedomInChrist #HolySpirit #Truth #SpiritualWarfare #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "If you forgive men their trespasses, your Father will forgive you. If you will not, neither will He. Unforgiveness is battery acid, and it is the one place Jesus says our refusal ties His hands to forgive us.",
    overlapNote: "Overlaps the unforgiveness short from this same remainder batch.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd9a49b5fbfaf6de4a99",
    url: "https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd9a49b5fbfaf6de4a99/preview?review-token=Mgg86Zf0eyLXpI-fUHd2RROghFwFguHgGNWeXxZyN-A",
    hasStar: false,
    title: "Matthew 6:33 Is a Fork in the Road",
    ytTags: " #Matthew633 #SeekFirst #KingdomFirst",
    igTags:
      " #Matthew633 #SeekFirst #KingdomFirst #DoNotBeAnxious #ChristianLiving #Conversion #Righteousness #Faith #Jesus #TrustGod #Provision #Repentance #Discipleship #Lordship #HolySpirit #Truth #SpiritualWarfare #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Therefore do not be anxious. The nations hunt food and covering; you are called to a different first thing. Matthew 6:33 is not extra religious activity stacked on top of panic. It is a fork: conversion of pursuit, not a quiet time added to an unchanged scramble.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd9a49b5fbfaf6de4a93",
    url: "https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd9a49b5fbfaf6de4a93/preview?review-token=8pp5k5qt40_kkVr3oPaNus6Q4fbGjj73M8u7NWS-f9Q",
    hasStar: false,
    title: "Obsession With Everything Going Wrong",
    ytTags: " #Unbelief #RenewYourMind #FaithOverFear",
    igTags:
      " #Unbelief #RenewYourMind #FaithOverFear #NegativeThinking #HopeInGod #MindOfChrist #Deliverance #Repentance #VictoryInChrist #TrustGod #Jesus #Faith #ChristianLiving #InnerHealing #Truth #SpiritualWarfare #FreedomInChrist #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "God cannot bring victory into a life that is convinced everything will go wrong. Obsession with the negatives of the past insists that darkness is more real than what God said. Persist in that story and you enable the very things you fear.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd9a49b5fbfaf6de4a8d",
    url: "https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd9a49b5fbfaf6de4a8d/preview?review-token=V_Gw2JqCAJj61fV0uSHfxJFw5HL5XA_fqTanMp-v1BA",
    hasStar: false,
    title: "Christian Living Redirects Desire",
    ytTags: " #SeekFirst #HolyDesire #Matthew633",
    igTags:
      " #SeekFirst #HolyDesire #Matthew633 #ChristianLiving #KingdomFirst #Righteousness #Conversion #Faith #Jesus #Discipleship #Lordship #TrustGod #Repentance #Holiness #HolySpirit #Truth #SpiritualWarfare #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Christian living is not the absence of desire; it is the redirection of desire. You already hunt. The gospel does not baptize Gentile anxiety; it replaces it. First means the kingdom sets the clock, the argument, the conscience, and the assignment.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd9a49b5fbfaf6de4a11",
    url: "https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd9a49b5fbfaf6de4a11/preview?review-token=_TtRGvOi8crIYay6K9SVpOMxXLogNp-2MEhejqWeXIo",
    hasStar: false,
    title: "Kingdom Without Righteousness Is Zeal Without Holiness",
    ytTags: " #KingdomAndRighteousness #Holiness #Matthew633",
    igTags:
      " #KingdomAndRighteousness #Holiness #Matthew633 #SeekFirst #JustificationByFaith #Sanctification #Jesus #Faith #Repentance #Lordship #ChristianLiving #Cross #HolySpirit #Truth #Discipleship #SpiritualWarfare #Deliverance #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Righteousness is both who God is and what He gives and requires. Kingdom without righteousness is zeal without holiness; righteousness without the kingdom is private virtue without allegiance. Seek His rightness, not a moral resume for Him to stamp.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd9a49b5fbfaf6de4a0b",
    url: "https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd9a49b5fbfaf6de4a0b/preview?review-token=bEhUZ5_WVP0iwiLvu_SAwkVk4fejt8Sy6O2oa5VapuU",
    hasStar: false,
    title: "Cheap Grace and Self-Righteousness",
    ytTags: " #CheapGrace #TrueRighteousness #Repentance",
    igTags:
      " #CheapGrace #TrueRighteousness #Repentance #Matthew633 #Holiness #Justification #Sanctification #Jesus #Faith #Lordship #ChristianLiving #TruthTelling #Restitution #HolySpirit #Cross #SpiritualWarfare #Deliverance #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Two ruins follow a false first: cheap grace with kingdom language and no repentance, and a hunt for our own righteousness which Jesus already condemned. The anxious perform for men; the proud perform for God. Neither has sought His righteousness.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd9a49b5fbfaf6de49c7",
    url: "https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd9a49b5fbfaf6de49c7/preview?review-token=y--5kBAMQ9-h7FaX88qbni8R0vB4t8tHHOCGxiMnBD8",
    hasStar: false,
    title: "You Do Not Become Neutral: You Seek Lesser Gods",
    ytTags: " #Matthew633 #Idolatry #SeekFirst",
    igTags:
      " #Matthew633 #Idolatry #SeekFirst #Prayer #WorkAsWorship #LesserGods #ChristianLiving #Repentance #Jesus #Faith #Lordship #Holiness #Truth #Discipleship #HolySpirit #SpiritualWarfare #Deliverance #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Prayer without seeking becomes noise. Work without seeking becomes idolatry. If this word is avoided, the life still seeks: applause, safety, image, revenge, novelty. You do not become neutral. You become a seeker of lesser gods with Christian vocabulary.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd6755ff3a9f86944c56",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dd6755ff3a9f86944c56/preview?review-token=ihh_vJys9utw8Uf_EsMRJpX9D98v7uOwS0yha1UFirc",
    hasStar: true,
    title: "Idle Words Will Judge You",
    ytTags: " #IdleWords #Integrity #Matthew12",
    igTags:
      " #IdleWords #Integrity #Matthew12 #LetYourYesBeYes #PersonOfYourWord #Truthfulness #Judgment #Jesus #Faith #Repentance #ChristianLiving #Honesty #HolySpirit #Discipleship #SpiritualWarfare #Deliverance #Truth #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "For every idle word men may speak, they will give account in the day of judgment. By your words you will be justified, and by your words you will be condemned. If you do not mean it, do not say it. Be a person of your word.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd6755ff3a9f86944c50",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dd6755ff3a9f86944c50/preview?review-token=IaPNHpZdp2TErKHta33ihbIWiwpKBv6mjkuK9l3Yn2c",
    hasStar: false,
    title: "When Gender Confusion Turns Deadly",
    ytTags: " #GodsDesign #IdentityInChrist #Truth",
    igTags:
      " #GodsDesign #IdentityInChrist #Truth #MaleAndFemale #ImageOfGod #Depression #HopeInChrist #Deliverance #Repentance #Jesus #Faith #ChristianLiving #Healing #HolySpirit #SpiritualWarfare #Freedom #Compassion #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "A woman convinced that being female was pointless tried to live as a man, found the brutality and silence demanded of that counterfeit, and after years of depression took her life. Rejecting God's design does not heal pain; it deepens it.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd6755ff3a9f86944c4a",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dd6755ff3a9f86944c4a/preview?review-token=2gWJQEWGGtRKEg5vzCvd2uM3b-VLLQ-dtaU4MI6WZqM",
    hasStar: true,
    title: "Turn the Other Cheek",
    ytTags: " #TurnTheOtherCheek #SermonOnTheMount #KingdomLove",
    igTags:
      " #TurnTheOtherCheek #SermonOnTheMount #KingdomLove #DoNotResistEvil #SecondMile #Jesus #Faith #Repentance #ChristianLiving #Forgiveness #Mercy #HolySpirit #Discipleship #SpiritualWarfare #Deliverance #Truth #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Do not resist an evil person. If anyone slaps your right cheek, turn the other also. If they sue for your tunic, let them have your cloak. If they compel one mile, go two. Give to the one who asks, and do not turn away the borrower.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd6755ff3a9f86944c3f",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dd6755ff3a9f86944c3f/preview?review-token=sQAeaK4JI4qO01nWeQx5757AOE3fO8_mAZYbf1AQwpo",
    hasStar: true,
    title: "Stop Violence by Damning It Up With Love",
    ytTags: " #LoveOverRevenge #SermonOnTheMount #KingdomEthics",
    igTags:
      " #LoveOverRevenge #SermonOnTheMount #KingdomEthics #PersonOfYourWord #TurnTheOtherCheek #Jesus #Faith #Repentance #ChristianLiving #Forgiveness #Mercy #HolySpirit #Discipleship #SpiritualWarfare #Deliverance #Truth #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "What you do marks you; what you say marks you. Then Jesus commands: do not resist an evil person. Let love have total preeminence. Stop the flow of violence by damning it up with love instead of returning blow for blow.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd6755ff3a9f86944c39",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dd6755ff3a9f86944c39/preview?review-token=okm4Eq11F03b7OuGidbOH6Zt8FJpqreGYHge8havjjw",
    hasStar: true,
    title: "Do Not Swear at All",
    ytTags: " #LetYourYesBeYes #Oaths #Matthew5",
    igTags:
      " #LetYourYesBeYes #Oaths #Matthew5 #Integrity #PersonOfYourWord #Truthfulness #Jesus #Faith #Repentance #ChristianLiving #Honesty #HolySpirit #Discipleship #SpiritualWarfare #Deliverance #Truth #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "You have heard, do not swear falsely, but perform your oaths to the Lord. Jesus says do not swear at all: not by heaven, earth, Jerusalem, or your own head. Let your yes be yes and your no be no; anything more is from the evil one.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd6755ff3a9f86944bdd",
    url: "https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dd6755ff3a9f86944bdd/preview?review-token=4IG50itMKfTp8OPup203_gRmAdFxS9HvLJheQxldvJs",
    hasStar: false,
    title: "Sextortion: Teenage Boys Blackmailed",
    ytTags: " #Sextortion #Purity #ProtectTheYoung",
    igTags:
      " #Sextortion #Purity #ProtectTheYoung #SexualImmorality #InternetSafety #Deliverance #Repentance #Jesus #Faith #ChristianLiving #Truth #Hope #HolySpirit #FreedomInChrist #SpiritualWarfare #Parents #Discipleship #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Every two hours another teenage boy is estimated to be blackmailed after nudes are swapped with someone pretending to be a friend. Thousands are demanded to bury the images, and some kill themselves when they cannot. This is why we flee and why we warn.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd28bbce63374892d38a",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dd28bbce63374892d38a/preview?review-token=iinPz_4n4aBPeBN8UsCyBlXu0aUwRf0MyCybWQWPdic",
    hasStar: false,
    title: "BDSM Is Counterfeit Covenant",
    ytTags: " #BDSM #SexualCorruption #TrueLove",
    igTags:
      " #BDSM #SexualCorruption #TrueLove #CounterfeitIntimacy #Holiness #Deliverance #Repentance #Jesus #Faith #Covenant #Purity #ImageOfGod #SpiritualWarfare #FreedomInChrist #Truth #ChristianLiving #HolySpirit #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "BDSM sits beside using people as objects of lust: counterfeit intimacy, counterfeit power, and counterfeit covenant. Blood contracts, hexes, and domination are not closeness. God will not bless a practice that trains the body that pain is the path to love.",
    overlapNote: "Shorter cut overlapping What God Will Not Tolerate About BDSM.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd28bbce63374892d368",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dd28bbce63374892d368/preview?review-token=825M9O3l7gdgm3HXk3SS8nf4u3LWSPTjlnLeEkSW2gM",
    hasStar: false,
    title: "Consent Is Not Covenant",
    ytTags: " #BDSM #Covenant #Holiness",
    igTags:
      " #BDSM #Covenant #Holiness #TrueLove #SexualPurity #Deliverance #Repentance #Jesus #Faith #ImageOfGod #Misogyny #Misandry #SpiritualWarfare #FreedomInChrist #Truth #ChristianLiving #HolySpirit #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Pain, humiliation, and domination are a lie about love. God will not treat consent as a substitute for covenant, nor exploration as a substitute for holiness. He will not share His altar with a master that uses His image as a canvas for harm.",
    overlapNote: "Overlaps the BDSM segment and neighboring short.",
  },
  {
    type: "SHORT",
    editId: "6aa2dd28bbce63374892d362",
    url: "https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/6aa2dd28bbce63374892d362/preview?review-token=UNUvUgPT2UoI3w25OhT-Kdl18TaiJIuaU1ktYag1Qns",
    hasStar: false,
    title: "5 STEPS OUT of BDSM",
    ytTags: " #BDSM #Forgiveness #Deliverance",
    igTags:
      " #BDSM #Forgiveness #Deliverance #UnhealedInjury #FreedomInChrist #Repentance #Jesus #Faith #InnerHealing #Holiness #Truth #ImageOfGod #SpiritualWarfare #ChristianLiving #HolySpirit #Purity #Hope #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Hatred of a sex is often unhealed injury wearing a theory. Forgiveness does not deny the harm; it stops serving the harm as master. That is the doorway out of BDSM mindsets: refuse the theory, tell the truth, and let Christ heal the wound.",
  },
  {
    type: "SHORT",
    editId: "6aa2dcac31eb7525df416541",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dcac31eb7525df416541/preview?review-token=2F5lvyPfZCiEdIdUWfoVRfT8lHJuCcKq7kOY3QKXSXQ",
    hasStar: true,
    title: "What Transfers in Sexual Oneness",
    ytTags: " #OneFlesh #Deliverance #SexualPurity",
    igTags:
      " #OneFlesh #Deliverance #SexualPurity #CovenantMarriage #SpiritOfSuicide #Holiness #Repentance #Jesus #Faith #InnerHealing #Truth #ChristianLiving #HolySpirit #SpiritualWarfare #FreedomInChrist #Parents #Discipleship #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Teach your kids: in sexual oneness, what is in them can transfer to you. Men have come for prayer after a night with a stranger, joy gone, suddenly wanting to die. The other person carried a spirit of suicide, and the join was real.",
  },
  {
    type: "SHORT",
    editId: "6aa2dcac31eb7525df41651c",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dcac31eb7525df41651c/preview?review-token=yJUV1zWWVi3erKM-JmHADzwQ0QF3NZrrEPKsSAP1olo",
    hasStar: false,
    title: "Factions, Klan, and Freemasons",
    ytTags: " #NoPartiality #SecretSocieties #Justice",
    igTags:
      " #NoPartiality #SecretSocieties #Justice #ImageOfGod #Truth #Repentance #Jesus #Faith #ChristianLiving #Holiness #Deliverance #SpiritualWarfare #Integrity #FreedomInChrist #HolySpirit #Discipleship #Righteousness #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Factions like the Klan or Freemasons denigrate one group and elevate another. Secret societies also shield their own, so some criminals walk with little prison time because of membership. God is no respecter of persons, and neither is His church.",
  },
  {
    type: "SHORT",
    editId: "6aa2dcac31eb7525df416516",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dcac31eb7525df416516/preview?review-token=AKBoCmG0tlxu8OxCqplB28pgX4i87oA-2y2jXlyBEgQ",
    hasStar: true,
    title: "If You Lust, You Have Already Committed Adultery",
    ytTags: " #Matthew5 #HeartPurity #Lust",
    igTags:
      " #Matthew5 #HeartPurity #Lust #Adultery #SexualPurity #Jesus #Faith #Repentance #ChristianLiving #Holiness #Deliverance #HolySpirit #SpiritualWarfare #Truth #Discipleship #FreedomInChrist #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "You have heard, do not commit adultery. Jesus says if you lust after a woman in your mind, you have already committed it. If your eye causes you to sin, gouge it out. Better to enter life maimed than to keep both eyes and miss heaven.",
  },
  {
    type: "SHORT",
    editId: "6aa2dcac31eb7525df416510",
    url: "https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6aa2dcac31eb7525df416510/preview?review-token=1Ko7bIKLzNXeQtcu2pYUZYPvdtA3gPurlQV-Zpus-fA",
    hasStar: false,
    title: "Infant Baptism and the Leaven of the Pharisees",
    ytTags: " #InfantBaptism #ReligiousLies #TrueDiscipleship",
    igTags:
      " #InfantBaptism #ReligiousLies #TrueDiscipleship #LeavenOfThePharisees #Repentance #Jesus #Faith #ChristianLiving #Baptism #Holiness #Truth #HolySpirit #SpiritualWarfare #Deliverance #Lordship #WordOfGod #FreedomInChrist #LivingWordMap #RR2026 #RepentanceProject",
    summary:
      "Look into why some religions enforce infant baptism and the answers itch: the baby moves least, adults take too long, or the child is supposedly most holy then. That is religious leaven. Believing those lies is being polluted by the Pharisees and Sadducees.",
  },
];

function countTags(s) {
  return (s.match(/#\S+/g) || []).length;
}

function ytDescription(item) {
  const parts = [item.summary, "", item.ytTags];
  if (item.extraAfterSummary?.length) {
    parts.push("");
    for (const line of item.extraAfterSummary) parts.push(line);
  }
  if (item.hasStar) {
    parts.push("");
    parts.push(STAR);
  }
  parts.push("");
  parts.push(FOOTER);
  return parts.join("\n");
}

function igCaption(item) {
  const parts = [item.title, "", item.igTags, "", "@JeremyRiddle", "", item.summary];
  if (item.hasStar) {
    parts.push("");
    parts.push(STAR);
  }
  parts.push("");
  parts.push(FOOTER);
  return parts.join("\n");
}

for (const item of items) {
  if (item.igTags) {
    const n = countTags(item.igTags);
    if (n > 20) throw new Error(`${item.title} has ${n} IG tags`);
  }
  if (countTags(item.ytTags) > 3) throw new Error(`${item.title} has too many YT tags`);
}

const queue = items.map((item, i) => {
  const num = 75 + i;
  return {
    num,
    type: item.type,
    editId: item.editId,
    url: item.url,
    hasStar: item.hasStar,
    title: item.title,
    ytTags: item.ytTags,
    igTags: item.igTags || null,
    summary: item.summary,
    extraAfterSummary: item.extraAfterSummary || null,
    overlapNote: item.overlapNote || null,
    isDuplicate: false,
    scheduledAt: new Date(START_MS + i * STEP).toISOString().replace(".000Z", ".000Z"),
    ytDescription: ytDescription(item),
    igCaption: item.type === "SHORT" ? igCaption(item) : null,
  };
});

const outDir =
  "C:\\Users\\tweed\\Downloads\\Video\\R&R\\shorts and text\\put shorts and segments here";
fs.writeFileSync(
  "C:\\Users\\tweed\\living-word-map\\scripts\\remainder-queue.json",
  JSON.stringify(queue, null, 2),
  "utf8"
);

const lines = [
  "Remainder batch (segments continued, then shorts) — copy fields into YouTube / Instagram.",
  "Original upload-metadata-notepad.txt was left unchanged.",
  "Starred links include https://mtfamilyfellowship.com/ between the summary and the shared footer.",
  "Typo URL riverside.adddacom was corrected to riverside.com for clip 6aa2dd9a49b5fbfaf6de4a93.",
  "",
];

for (const item of queue) {
  lines.push("================================================================================");
  lines.push(`[${item.num}] ${item.type === "SHORT" ? "SHORT" : "YOUTUBE SEGMENT"}`);
  lines.push(`Link: ${item.url}`);
  if (item.overlapNote) lines.push(`Note: ${item.overlapNote}`);
  lines.push("");
  lines.push("TITLE");
  lines.push(item.title);
  lines.push("");
  lines.push("YOUTUBE HASHTAGS");
  lines.push(item.ytTags);
  lines.push("");
  if (item.igTags) {
    lines.push("INSTAGRAM HASHTAGS");
    lines.push(item.igTags);
    lines.push("");
  }
  lines.push("SUMMARY");
  lines.push(item.summary);
  lines.push("");
  if (item.extraAfterSummary?.length) {
    for (const extra of item.extraAfterSummary) {
      lines.push(extra);
      lines.push("");
    }
  }
  if (item.hasStar) {
    lines.push(STAR);
    lines.push("");
  }
  lines.push(FOOTER);
  lines.push("");
}

fs.writeFileSync(
  `${outDir}\\upload-metadata-notepad-remainder.txt`,
  lines.join("\n"),
  "utf8"
);

console.log("Wrote", queue.length, "items, nums", queue[0].num, "to", queue.at(-1).num);
console.log("First scheduled", queue[0].scheduledAt, "last", queue.at(-1).scheduledAt);
console.log(
  "Shorts",
  queue.filter((x) => x.type === "SHORT").length,
  "segments",
  queue.filter((x) => x.type === "SEGMENT").length
);
