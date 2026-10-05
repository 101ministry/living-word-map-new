import fs from 'node:fs';
import path from 'node:path';

const outPath = 'C:\\Users\\tweed\\Downloads\\Video\\R&R\\shorts and text\\put shorts and segments here\\upload-metadata-notepad.txt';
const queuePath = 'scripts/scheduled-queue.json';

const items = [
  // --- SHORTS (1 - 54) ---
  {
    num: 1,
    type: 'SHORT',
    editId: 'db9ad2f7140880f5f8850141',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/db9ad2f7140880f5f8850141/preview?review-token=sTtVwjp3O6VrY2TwNwf0s3h_PJyf4RXsGgrj0TQEKAQ',
    hasStar: true,
    title: "Discovering Prayer's Power",
    ytTags: " #Prayer #SpiritualAuthority #PowerOfPrayer",
    igTags: " #Prayer #SpiritualAuthority #PowerOfPrayer #HabitOfPrayer #PrayerLife #DailyPrayer #ChristianLiving #BelieversAuthority #KingdomAuthority #SpiritualDiscipline #Intercession #Faith #Repentance #SpiritualWarfare #Deliverance #Lordship #Christ #Jesus #LivingWordMap #RepentanceProject",
    summary: "When you discover the authority, power, and kingdom purpose accomplished through prayer, praying stops being a religious calisthenic or a chore you are told you ought to do. You begin to realize what authority you have in Christ, and prayer becomes a passionate daily habit you truly desire."
  },
  {
    num: 2,
    type: 'SHORT',
    editId: '784eda6827f2011c3fa635c7',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/784eda6827f2011c3fa635c7/preview?review-token=llmkoNB_Q4jfe2ejiiMvytp7TblfAyRW8kxDRfNfT_o',
    hasStar: true,
    title: "Pray Without Ceasing: God-Mindedness",
    ytTags: " #PrayWithoutCeasing #GodConsciousness #PrayerLife",
    igTags: " #PrayWithoutCeasing #GodConsciousness #PrayerLife #DailyWalk #PointOfReference #HabitualPrayer #MindOfChrist #SpiritualDiscipline #FaithWalk #AbidingInChrist #ContinualPrayer #ChristianWalk #PresenceOfGod #Repentance #SpiritualWarfare #Deliverance #Lordship #Christ #LivingWordMap #RepentanceProject",
    summary: "Praying without ceasing does not mean pausing everyday life or living on your knees 24/7. It means walking with continuous God-consciousness—making the Lord your constant point of reference throughout the day, just as a loving spouse and children are never far from your thoughts."
  },
  {
    num: 3,
    type: 'SHORT',
    editId: 'f1f2d008fd0ad617c95f4921',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/f1f2d008fd0ad617c95f4921/preview?review-token=MKRtXl1D-sey65T6ql8J8eLES8sbe_tLGCPUGd9EtQg',
    hasStar: false,
    title: "Overcoming Compulsive Desires",
    ytTags: " #CompulsiveDesires #Deliverance #LustAndAddiction",
    igTags: " #CompulsiveDesires #Deliverance #LustAndAddiction #Objectification #FreedomInChrist #MindRenewal #SoulHealing #InnerHealing #BreakingAddiction #SexualPurity #Repentance #OvercomingSin #BiblicalTruth #Sanctification #Lordship #JesusSaves #DeliveranceMinistry #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Compulsive lust and addiction reduce human beings into objects to be used rather than people made in God's image. Breaking free begins with honest confession—recognizing that self-willed compulsion is rebellion against God's design, and surrendering your mind to Christ's transforming truth."
  },
  {
    num: 4,
    type: 'SHORT',
    editId: 'd1e2ab813753a8098991b46f',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/d1e2ab813753a8098991b46f/preview?review-token=9qnfU23D9vbmOVhy6fSyTBKVZI8bbdlGhCvWKU41Wbo',
    hasStar: true,
    title: "Forgiveness: A Choice, Not a Feeling",
    ytTags: " #Forgiveness #InnerHealing #LettingGo",
    igTags: " #Forgiveness #InnerHealing #LettingGo #ChoiceNotFeeling #HealingTrauma #BitternessBroken #ReleaseResentment #FreedomInChrist #EmotionalHealing #Deliverance #Grace #ActOfWill #ChristianHealing #ForgiveOthers #Lordship #Repentance #SpiritualWarfare #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Forgiveness never starts with a feeling—it begins as an act of the will in obedience to Jesus Christ. Decades of bitterness, trauma, and anger can be worn like a defensive armor that poisons the soul, but choosing to forgive breaks the prison and transforms us from the inside out."
  },
  {
    num: 5,
    type: 'SHORT',
    editId: '70af75940444d7fc6299f4b8',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/70af75940444d7fc6299f4b8/preview?review-token=seUzlHxr2N8cnYm6ErQ-VIpukCaiOIAnwC3VvKWljBA',
    hasStar: true,
    title: "Forgiveness: A Commandment",
    ytTags: " #Forgiveness #InnerHealing #KingdomCommand",
    igTags: " #Forgiveness #InnerHealing #KingdomCommand #ObedienceToChrist #Matthew6 #UnforgivenessPoison #HeartHealing #Deliverance #SpiritualFreedom #Grace #Reconciliation #LoveYourEnemies #FreedomFromBitterness #Lordship #ChristianWalk #SpiritualWarfare #Repentance #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Unforgiveness is like drinking battery acid and hoping it hurts the other person. Scripture leaves no middle ground: if we do not forgive others, our heavenly Father will not forgive us. When you lack the strength to forgive on your own, ask the Holy Spirit to supply the supernatural love and grace to release them."
  },
  {
    num: 6,
    type: 'SHORT',
    editId: '72f0621e471c962ce18ba009',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/72f0621e471c962ce18ba009/preview?review-token=ljWGkzPsa-s6k5v1_TXa7Nfv_cp2nFufYo82sNrTs-Q',
    hasStar: true,
    title: "Forgive or Die: A Cancer Patient's Struggle",
    ytTags: " #ForgiveOrDie #HealingAndForgiveness #Bitterness",
    igTags: " #ForgiveOrDie #HealingAndForgiveness #Bitterness #SpiritualRootsOfDisease #Unforgiveness #InnerHealing #ReleaseOffense #PhysicalHealing #Deliverance #FaithAndHealing #LifeOrDeath #PowerOfForgiveness #Repentance #SpiritualWarfare #HolySpiritConviction #ChristianTestimony #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Holding onto deep resentment and unforgiveness can have catastrophic spiritual and physical consequences. When confronted with life-threatening illness, the piercing question remains: would you rather cling to your offense, or forgive and lay hold of life in Christ?"
  },
  {
    num: 7,
    type: 'SHORT',
    editId: 'fcbb219a3a8b2c6d26af4974',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/fcbb219a3a8b2c6d26af4974/preview?review-token=GQA8K4hlHpbC7bm79AQb5rdsPRiSVhrfR2aCVVZbMHs',
    hasStar: true,
    title: "Prayer in Tongues: Brain Benefits",
    ytTags: " #PrayingInTongues #HolySpirit #SpiritualEdification",
    igTags: " #PrayingInTongues #HolySpirit #SpiritualEdification #BrainScience #Neurotheology #PrayingInTheSpirit #EdifyYourself #SpiritualRenewal #SupernaturalPeace #ChristianScience #PowerOfPrayer #Tongues #MindRenewal #Deliverance #Repentance #SpiritualWarfare #Lordship #Christ #LivingWordMap #RepentanceProject",
    summary: "Neurological research demonstrates that praying in the Spirit uniquely stimulates and balances brain activity, releasing neural benefits and promoting profound inner peace. Scripture confirms that praying in the Spirit edifies the believer, renewing both inner spirit and cognitive resilience."
  },
  {
    num: 8,
    type: 'SHORT',
    editId: '0e5d589c35c909d3df54b91a',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/0e5d589c35c909d3df54b91a/preview?review-token=DT2PuWs6dFEwjAu-MZD53gEqaM7RDKUKtmW_ch7DV5U',
    hasStar: true,
    title: "Breaking the Cycle of Bitterness",
    ytTags: " #Bitterness #GenerationalCurses #Deliverance",
    igTags: " #Bitterness #GenerationalCurses #Deliverance #RootOfBitterness #HeartHealing #Forgiveness #BreakCycles #FamilyRestoration #InnerHealing #SoulTies #SpiritualFreedom #OvercomingResentment #MindRenewal #Repentance #SpiritualWarfare #HolySpirit #JesusHeals #LivingWordMap #RR2026 #RepentanceProject",
    summary: "A root of bitterness does not stay dormant—it defiles many and entrenches generational cycles of resentment. True freedom comes when we recognize the bitter root, renounce familiar identities of grievance, and invite the cross of Christ to sever the cycle once and for all."
  },
  {
    num: 9,
    type: 'SHORT',
    editId: '23addabe178f639572bf7f50',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/23addabe178f639572bf7f50/preview?review-token=t9zMitwgb-2Y6-X2qaJkMdCYuk0LI5yrmfEFay8CZJA',
    hasStar: false,
    title: "The Struggle of Overworking",
    ytTags: " #Workaholism #RestInGod #IdentityInChrist",
    igTags: " #Workaholism #RestInGod #IdentityInChrist #Burnout #UnhealthyStriving #TraumaResponse #PerformanceTrap #FalseSecurity #SabbathRest #EmotionalHealing #InnerPeace #Deliverance #SoulRest #Repentance #SpiritualWarfare #KingdomPriorities #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Chronic overworking is often not diligence, but a trauma response masking pain, unworthiness, or fear of stillness. When our identity is tethered to endless striving, we neglect relational duty and spiritual rest. God calls us out of anxious toil into confidence in His provision."
  },
  {
    num: 10,
    type: 'SHORT',
    editId: '8795f8027a290f7ff2c1831c',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/8795f8027a290f7ff2c1831c/preview?review-token=z2fa2OKn8DNb8Y73wLFvzTh3rm6_-FMnTkm-iNhhNo4',
    hasStar: true,
    title: "Forgiveness: A Path to Healing",
    ytTags: " #Forgiveness #EmotionalHealing #SpiritualFreedom",
    igTags: " #Forgiveness #EmotionalHealing #SpiritualFreedom #InnerHealing #ReleaseOffense #BrokenHeart #PeaceOfGod #SoulRestoration #Deliverance #OvercomeBitterness #Grace #Mercy #HeartTransformation #ChristianHealing #Repentance #SpiritualWarfare #Lordship #JesusHeals #LivingWordMap #RepentanceProject",
    summary: "Forgiveness unlocks the doorway to emotional and spiritual wholeness. You cannot experience complete healing while guarding old wounds; releasing offenders into God's sovereign justice allows the balm of Gilead to heal what anger has kept inflamed for years."
  },
  {
    num: 11,
    type: 'SHORT',
    editId: '83bf66e345db915021e37c1f',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/83bf66e345db915021e37c1f/preview?review-token=jxHybm5oxdPYrQv-60YuddNMssO1ifcXkwVkSExmvMQ',
    hasStar: false,
    title: "The Struggle of Saying 'No'",
    ytTags: " #PeoplePleasing #BiblicalBoundaries #FearOfMan",
    igTags: " #PeoplePleasing #BiblicalBoundaries #FearOfMan #SayingNo #GodFirst #HolyBoldness #FreedomFromApproval #Codependency #EmotionalHealth #Discernment #RightPriorities #KingdomLiving #Deliverance #SpiritualFreedom #Repentance #SpiritualWarfare #Lordship #JesusLord #LivingWordMap #RepentanceProject",
    summary: "An inability to say 'no' is frequently driven by the snare of the fear of man and codependent people-pleasing. Saying yes to everyone else means saying no to God's specific calling on your life. Biblical boundaries protect kingdom stewardship and keep Christ as your only Master."
  },
  {
    num: 12,
    type: 'SHORT',
    editId: '817940b8cf2a851edebf4d52',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/817940b8cf2a851edebf4d52/preview?review-token=zS2_Td8EZI3c_JBQHoYRXINp93yJDYSQSo8U72ZfPB4',
    hasStar: false,
    title: "Overcoming Obsession with Failure",
    ytTags: " #FearOfFailure #IdentityInChrist #MindRenewal",
    igTags: " #FearOfFailure #IdentityInChrist #MindRenewal #OvercomingDefeat #SpiritualParalysis #FaithOverFear #VictoryInChrist #RenounceLies #GodsPromises #ConfidenceInGod #Deliverance #SpiritualBreakthrough #EmotionalHealing #Repentance #SpiritualWarfare #Lordship #JesusSaves #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Obsessing over past failures paralyzes your faith and blinds you to God's redemptive power. The enemy seeks to define you by your worst mistakes, but in Christ your standing is defined by His righteousness. Break agreement with condemnation and step forward in faith."
  },
  {
    num: 13,
    type: 'SHORT',
    editId: '455238f6254a9a7ef465cfc3',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/455238f6254a9a7ef465cfc3/preview?review-token=oMooX_Az5KDt1wEm3w-IuZA_FwxJl4YAeFaWnmE-e5M',
    hasStar: false,
    title: "Conviction vs Condemnation",
    ytTags: " #HolySpiritConviction #NoCondemnation #SpiritualDiscernment",
    igTags: " #HolySpiritConviction #NoCondemnation #SpiritualDiscernment #Romans81 #VoiceOfGod #AccuserOfTheBrethren #GraceAndTruth #RepentanceBringsLife #InnerPeace #Deliverance #FreedomInChrist #MindRenewal #SpiritualGrowth #Lordship #ChristianLiving #Repentance #SpiritualWarfare #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Holy Spirit conviction draws you toward the Father in hopeful repentance, whereas demonic condemnation drives you into shame, despair, and hiding. Learning to discern between the gentle discipline of the Spirit and the accusations of the adversary is vital for walking in true freedom."
  },
  {
    num: 14,
    type: 'SHORT',
    editId: '18db6d69c27909223e48e6bb',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/18db6d69c27909223e48e6bb/preview?review-token=XbCpM3aB_pbTf5ITuHNw7kHt4SryTdoBot0oyFqcHgY',
    hasStar: false,
    title: "Christianity: Citizenship, Not Self-Improvement",
    ytTags: " #KingdomOfGod #KingdomCitizenship #TrueDiscipleship",
    igTags: " #KingdomOfGod #KingdomCitizenship #TrueDiscipleship #NotSelfHelp #LordshipOfJesus #SubmittingToGod #NewCovenant #ReignOfGod #SpiritualAuthority #BiblicalChristianity #BornAgain #Deliverance #SurrenderedLife #GospelOfKingdom #Repentance #SpiritualWarfare #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Christianity is not a therapeutic program for moral self-improvement—it is citizenship in an active spiritual Kingdom under the sovereign Lordship of Jesus Christ. We do not modify our habits to please ourselves; we bow our wills and live under the laws and government of our King."
  },
  {
    num: 15,
    type: 'SHORT',
    editId: '938f3960124056a35c0bec73',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/938f3960124056a35c0bec73/preview?review-token=GQPtbHG5Mzp04QNxmPRXOIeAjF1jLV6qBjz7JCuPC08',
    hasStar: false,
    title: "Doubt: Choosing Not to Believe",
    ytTags: " #OvercomingDoubt #FaithVsUnbelief #WordOfGod",
    igTags: " #OvercomingDoubt #FaithVsUnbelief #WordOfGod #ChoosingFaith #UnbeliefRebuked #HeartOfFaith #TrustGod #BiblicalTruth #StandingOnPromises #SpiritualClarity #Deliverance #MindRenewal #RootOutDoubt #Lordship #Repentance #SpiritualWarfare #ChristianFaith #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Doubt is rarely an innocent intellectual puzzle; at its root, it is often a stubborn choice not to believe what God has clearly spoken. Faith requires an intentional surrender of cynical autonomy, choosing to trust God's character and honor His Word above our shifting doubts."
  },
  {
    num: 16,
    type: 'SHORT',
    editId: '6b0ecd99ac711d6cdd13e645',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6b0ecd99ac711d6cdd13e645/preview?review-token=QQ8jeCENhVGyQLTUPgjKYZJ_u3IFacoLE7FIDgcooN0',
    hasStar: true,
    title: "Prayer for Enemies: Impact on Kingdom",
    ytTags: " #LoveYourEnemies #KingdomIntercession #SpiritualWarfare",
    igTags: " #LoveYourEnemies #KingdomIntercession #SpiritualWarfare #Matthew544 #PrayForPersecutors #KingdomPower #OvercomingEvilWithGood #SupernaturalLove #Deliverance #HeartTransformation #Humility #PowerInPrayer #ChristlikeLove #Repentance #SpiritualAuthority #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Praying sincerely for those who mistreat and persecute you strikes a devastating blow against demonic strongholds. When you intercede for enemies instead of retaliating, you release God's supernatural power and reflect the authentic, sacrificial nature of the Father's Kingdom."
  },
  {
    num: 17,
    type: 'SHORT',
    editId: '6300ced05c0aa82112d4fd93',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6300ced05c0aa82112d4fd93/preview?review-token=YQWSN39jvmf0C61tPFyIkRmjpu3o53NVMi4760bLFfI',
    hasStar: true,
    title: "Love Your Enemies: Matthew 5:44-45",
    ytTags: " #LoveYourEnemies #Matthew544 #SonsOfTheFather",
    igTags: " #LoveYourEnemies #Matthew544 #SonsOfTheFather #ChristCommand #GraceUnderFire #SupernaturalCharity #OvercomeEvil #BiblicalDiscipleship #HeartOfGod #PerfectionInLove #KingdomStandard #Deliverance #InnerHealing #Repentance #SpiritualWarfare #Lordship #JesusWords #LivingWordMap #RR2026 #RepentanceProject",
    summary: "In Matthew 5, Jesus commands us to love our enemies and bless those who curse us so that we may be true sons of our Father in heaven. Anyone can love those who love them back; the unmistakable hallmark of the Spirit of Christ is radical love poured out on those who oppose us."
  },
  {
    num: 18,
    type: 'SHORT',
    editId: 'b01f67512aaae6d610a884a4',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/b01f67512aaae6d610a884a4/preview?review-token=zU7mWkSrsgRgLXZGVK0-O7-jgbyvv9EaFLvBXk5exTQ',
    hasStar: true,
    title: "Son Calls Senator for Personhood Bill",
    ytTags: " #SanctityOfLife #PersonhoodBill #RightToLife",
    igTags: " #SanctityOfLife #PersonhoodBill #RightToLife #BiblicalJustice #StandForTruth #ProtectTheUnborn #GodsLaw #CourageousFaith #ChristianActivism #MoralCourage #SpeakForVoiceless #KingdomAdvocacy #Righteousness #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Confronting civil authorities with biblical truth requires conviction that human life is sacred from conception. When a son stands before lawmakers to demand true personhood for the unborn, it demonstrates the bold righteousness that every Christian generation must embody."
  },
  {
    num: 19,
    type: 'SHORT',
    editId: 'e6514210f5907017fed76162',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/e6514210f5907017fed76162/preview?review-token=kpGn6ooB8bDG5vkh3DRUBGs4cAxJ48bhGyl-Qy75oeM',
    hasStar: true,
    title: "God's Mercy: Loving Enemies",
    ytTags: " #GodsMercy #UnmeritedGrace #LoveYourEnemies",
    igTags: " #GodsMercy #UnmeritedGrace #LoveYourEnemies #DivineForgiveness #MercyTriumphs #ExtendingGrace #HeartOfCompassion #Reconciliation #Deliverance #InnerHealing #ChristLikeness #KingdomCulture #Repentance #SpiritualWarfare #LordshipOfChrist #LivingWordMap #RR2026 #RepentanceProject",
    summary: "God proved His boundless mercy by sending Christ to die for us while we were still His enemies. When we extend mercy to those who wrong us, we mirror the same unmerited grace that rescued our souls from eternal destruction."
  },
  {
    num: 20,
    type: 'SHORT',
    editId: 'c9dd4956a34429dadbcd1b84',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/c9dd4956a34429dadbcd1b84/preview?review-token=a_FtM_-2kCK2aQK1PMkCLBwrJlxkSyNZvmeocOFQhck',
    hasStar: true,
    title: "Son Calls Out Senator on Personhood Bill",
    ytTags: " #ProtectTheUnborn #Personhood #BiblicalTruth",
    igTags: " #ProtectTheUnborn #Personhood #BiblicalTruth #RightToLife #DefendTheHelpless #BoldWitness #SanctityOfLife #MoralClarity #Accountability #KingdomJustice #StandFirm #ChristianCourage #Repentance #SpiritualWarfare #Deliverance #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Holding leaders accountable to God's standard of justice is an urgent Christian duty. Compromise on the protection of innocent life forfeits moral authority; uncompromising witness exposes political duplicity and honors the Creator of life."
  },
  {
    num: 21,
    type: 'SHORT',
    editId: 'c1516aa505ea0074c31fd361',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/c1516aa505ea0074c31fd361/preview?review-token=ScA4HNcD6wCy948qMDCaWo6g7Fwp18RALglRK0l0jRw',
    hasStar: false,
    title: "The Fork in the Road: Matthew 6:33",
    ytTags: " #SeekFirstTheKingdom #Matthew633 #KingdomPriorities",
    igTags: " #SeekFirstTheKingdom #Matthew633 #KingdomPriorities #ForkInTheRoad #TrustGodsProvision #SurrenderAll #RadicalObedience #NoCompromise #FaithWalk #DeliveranceFromAnxiety #BiblicalDiscipleship #Righteousness #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Every believer comes to a definitive fork in the road: pursue personal comfort and worldly security, or seek first the Kingdom of God and His righteousness. Trusting God's promise in Matthew 6:33 means relinquishing anxious striving and staking your entire life on His faithfulness."
  },
  {
    num: 22,
    type: 'SHORT',
    editId: 'bd880aa1b9fe163a696e957f',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/bd880aa1b9fe163a696e957f/preview?review-token=Hazq-SB4paGwzg6bzRdsGuWzGFQzuCyFbJzVAu97WJE',
    hasStar: false,
    title: "The Kingdom: God's Active Reign",
    ytTags: " #KingdomOfGod #GodsReign #SovereigntyOfChrist",
    igTags: " #KingdomOfGod #GodsReign #SovereigntyOfChrist #ActiveRule #KingJesus #ThyKingdomCome #KingdomAuthority #SpiritualDominion #RighteousRule #BowingToTheKing #Deliverance #KingdomPower #TrueGospel #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "The Kingdom of God is not an abstract religious theory—it is God's active, present, and decisive reign over hearts, minds, and affairs. To enter the Kingdom is to joyfully submit to King Jesus and bring every sphere of life under His sovereign government."
  },
  {
    num: 23,
    type: 'SHORT',
    editId: '0016f5c1a6c3b7292d412085',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/0016f5c1a6c3b7292d412085/preview?review-token=TwG-qljRPfcNoWUzuPrCjNUGVdIvUI77GAPUS2TWFgA',
    hasStar: true,
    title: "Hurt People Hurt People",
    ytTags: " #HurtPeopleHurtPeople #InnerHealing #GenerationalPain",
    igTags: " #HurtPeopleHurtPeople #InnerHealing #GenerationalPain #BreakingTheCycle #RootOfPain #TraumaHealing #Deliverance #ForgivenessHeals #CompassionInTruth #SoulHealing #EmotionalRestoration #StopTheBleeding #ChristHeals #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Unhealed trauma invariably leaks out as cruelty, control, or abuse toward others. Recognizing that 'hurt people hurt people' does not excuse evil, but it illuminates the root wound so Christ's deliverance can break the chain and bring lasting healing."
  },
  {
    num: 24,
    type: 'SHORT',
    editId: 'a2831d67879c0ef558e80f24',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/a2831d67879c0ef558e80f24/preview?review-token=TBAPGeemuoNlut6C2WnMOlydsqd-BUX06s-NGW3w738',
    hasStar: false,
    title: "Nephilim Worship: Bestiality & Homosexuality",
    ytTags: " #SexualPerversion #BiblicalBoundaries #Deliverance",
    igTags: " #SexualPerversion #BiblicalBoundaries #Deliverance #AncientSpirits #DefilementOfFlesh #Genesis6 #ExposingDarkness #GodsCreatedOrder #SpiritualPurity #BreakingCovenants #HolyLiving #BiblicalTruth #Repentance #SpiritualWarfare #DeliveranceMinistry #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Ancient demonic spirits have long sought to defile God's created order by erasing distinctions and polluting human sexuality. Scripture warns against the occult roots behind sexual perversions; genuine repentance and the blood of Jesus dismantle these ancient strongholds."
  },
  {
    num: 25,
    type: 'SHORT',
    editId: '030dcd09896c7d4bf7fdc58d',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/030dcd09896c7d4bf7fdc58d/preview?review-token=vUhWh43XKGowIcACOqWuQiD-hHCgB0J-o0rkmd2tlRM',
    hasStar: true,
    title: "Words Matter: Be a Person of Your Word",
    ytTags: " #WordsMatter #Integrity #TruthInHeart",
    igTags: " #WordsMatter #Integrity #TruthInHeart #LetYourYesBeYes #PowerOfTheTongue #RighteousSpeech #Honesty #ChristianCharacter #CovenantKeeping #Accountability #SpeakLife #DeliveranceFromLies #MoralClarity #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Our words carry spiritual weight in the heavenly realm and among men. When believers fail to keep promises, they dishonor God and invite deception into their house; living as a person of your word establishes divine integrity and kingdom trust."
  },
  {
    num: 26,
    type: 'SHORT',
    editId: '7c0f295a57efa1f09f830968',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/7c0f295a57efa1f09f830968/preview?review-token=2UFbDbX9-1bLFFtFB6cy-fHJmshfIobyvz6KimDoGYg',
    hasStar: true,
    title: "Be a Person of Your Word",
    ytTags: " #IntegrityInSpeech #Honesty #FaithfulWitness",
    igTags: " #IntegrityInSpeech #Honesty #FaithfulWitness #Truthfulness #CharacterMatters #KeptPromises #WalkInTruth #GodlyIntegrity #TameTheTongue #RighteousConduct #SpiritualDiscipline #Repentance #SpiritualWarfare #Deliverance #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Jesus taught that our 'yes' should be yes, and our 'no' should be no. Flippant speech and unkept vows breach relational trust and open doors to spiritual confusion; standing by your word reflects the unshakeable faithfulness of our Creator."
  },
  {
    num: 27,
    type: 'SHORT',
    editId: '0639f9a3c0b4da59b4e10120',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/0639f9a3c0b4da59b4e10120/preview?review-token=ViX3HTOXkijGhc1H7syacXzzJGbgQJikorFOZj7xDaI',
    hasStar: false,
    title: "Masturbation & Demonic Hybrids",
    ytTags: " #SexualPurity #DeliveranceFromLust #MindWarfare",
    igTags: " #SexualPurity #DeliveranceFromLust #MindWarfare #OccultRoots #SoulDefilement #BreakingLust #SpiritualCleanse #FreedomInChrist #RenewYourMind #HolyImagination #Deliverance #InnerHealing #ExposingDarkness #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Compulsive sexual fantasizing and masturbation are not solitary, harmless habits—they feed demonic appetites in the spiritual realm and bind the soul in familiar bondage. Deliverance begins by dragging fantasy into Christ's light and establishing sexual purity in heart and deed."
  },
  {
    num: 28,
    type: 'SHORT',
    editId: 'cae06ef6d082be4d8c09e3d1',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/cae06ef6d082be4d8c09e3d1/preview?review-token=CwdZfOMZCXcwPefk8gSSt7XZytuHBlpY59X8RczKbIo',
    hasStar: true,
    title: "Transforming Neighborhood with Kindness",
    ytTags: " #LoveYourNeighbor #GoodWorks #KingdomWitness",
    igTags: " #LoveYourNeighbor #GoodWorks #KingdomWitness #OvercomeEvilWithGood #ActiveFaith #PracticalChristianity #CommunityTransformation #SaltAndLight #ServeOthers #HeartOfChrist #EvangelismInAction #Deliverance #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "True neighborhood transformation happens not through political posturing, but through tangible, sacrificial acts of Christian love and kindness. Loving difficult neighbors disarms hostility and creates open doors for the saving Gospel of Jesus."
  },
  {
    num: 29,
    type: 'SHORT',
    editId: '98ced2e281ada5c602dabe37',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/98ced2e281ada5c602dabe37/preview?review-token=RdYSFaaHw-cn1NXl-OoAkUiMs_ZIKb399xQA7CeM2cg',
    hasStar: true,
    title: "Jesus' Quick Way to Discipleship",
    ytTags: " #BiblicalDiscipleship #FollowJesus #CostOfDiscipleship",
    igTags: " #BiblicalDiscipleship #FollowJesus #CostOfDiscipleship #ObedienceImmediately #SurrenderAll #TrueDisciple #StraightforwardGospel #UncompromisedFaith #WalkAsHeWalked #KingdomStandards #Deliverance #SpiritualMaturity #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Jesus did not call converts to a leisurely theological debate; He demanded immediate obedience, radical surrender, and uncompromising love for God and others. Discipleship accelerates when we stop hesitating and actively do what our Lord has commanded."
  },
  {
    num: 30,
    type: 'SHORT',
    editId: '46cb0091317d5dc2617a3e36',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/46cb0091317d5dc2617a3e36/preview?review-token=crITVSLJtIiF60QZuMRywzPLxOHrO4Y6PY63sZTp2Ro',
    hasStar: true,
    title: "Jesus' Surprising Teachings",
    ytTags: " #TeachingsOfJesus #SermonOnTheMount #RadicalGospel",
    igTags: " #TeachingsOfJesus #SermonOnTheMount #RadicalGospel #UpsideDownKingdom #ChallengingTruth #BeyondReligion #HolySpiritTransformation #UncompromisingWord #GraceAndTruth #Discipleship #Deliverance #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "The teachings of Jesus overturn the fallen wisdom of the world at every turn—exalting the humble, blessing the persecuted, and demanding heart purity over religious performance. Walking with Him requires abandoning worldly common sense for heavenly truth."
  },
  {
    num: 31,
    type: 'SHORT',
    editId: '2cf9ec3034cf417469d6b23d',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/2cf9ec3034cf417469d6b23d/preview?review-token=DnTq4OATPcdjVCErZybB4QQeRb0JUZ3Rag0taZGETHE',
    hasStar: false,
    title: "Pornography's Hidden Dangers",
    ytTags: " #PornDangers #SexualPurity #FreedomInChrist",
    igTags: " #PornDangers #SexualPurity #FreedomInChrist #ExposingPorn #MentalTies #SpiritualBlindness #DeliveranceFromPorn #CleanHeart #CovenantPurity #SoulPollution #MindRenewal #BreakEveryChains #SpiritualWarfare #Repentance #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Pornography secretly desensitizes the conscience, destroys marital intimacy, and bonds the viewer to predatory spiritual forces. Exposing the lie and submitting to biblical deliverance cleanses the mind and restores genuine intimacy under God."
  },
  {
    num: 32,
    type: 'SHORT',
    editId: '10fdd7e07b726962518ca92f',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/10fdd7e07b726962518ca92f/preview?review-token=-1OUq-RKM419mdqmCzTfiyJUUkDvy-5tiahwtJhTViQ',
    hasStar: true,
    title: "Jesus' Shocking New Commandment",
    ytTags: " #NewCommandment #LoveOneAnother #KingdomStandard",
    igTags: " #NewCommandment #LoveOneAnother #KingdomStandard #John1334 #SacrificialLove #MarkOfDisciples #SupernaturalUnity #HeartOfChrist #BrotherlyLove #TrueFellowship #Deliverance #InnerHealing #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Jesus gave His followers a shocking, non-negotiable commandment: love one another as I have loved you. This supernatural love is not sentimental affinity, but self-giving sacrifice that proves to a watching world that we belong to Christ."
  },
  {
    num: 33,
    type: 'SHORT',
    editId: 'a9ada7b2e950400123f8bc21',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/a9ada7b2e950400123f8bc21/preview?review-token=XpProRTgYr62i4wnb1WqnZR3n58am9it0NxjtYC-D5E',
    hasStar: true,
    title: "Jesus Redefines 'Neighbor'",
    ytTags: " #WhoIsMyNeighbor #GoodSamaritan #ActiveCompassion",
    igTags: " #WhoIsMyNeighbor #GoodSamaritan #ActiveCompassion #BreakPrejudice #KingdomLove #CrossCulturalGrace #SelflessCare #MercyInAction #BiblicalNeighbor #TrueReligion #Deliverance #HeartChange #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "In the parable of the Good Samaritan, Jesus shattered religious tribalism and redefined 'neighbor' as anyone in need right in front of us. Loving your neighbor means stepping across cultural divisions with practical, costly compassion."
  },
  {
    num: 34,
    type: 'SHORT',
    editId: '008a1ac1c307d22e520f30ea',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/008a1ac1c307d22e520f30ea/preview?review-token=u3R0Ir1VPD80pTLJN_NydayN9YfXigEoXOThF0S94Mg',
    hasStar: true,
    title: "Jesus' New Kingdom: Love Enemies",
    ytTags: " #LoveEnemies #KingdomOfHeaven #RadicalMercy",
    igTags: " #LoveEnemies #KingdomOfHeaven #RadicalMercy #ChristLikeCharacter #SpiritualMaturity #TurningCheek #SupernaturalGrace #DefeatingDarkness #KingdomOverCulture #DivinePower #Deliverance #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "The Kingdom of God operates on principles diametrically opposed to fallen human nature. When you answer hostility with blessing and love your enemies, you display the unmistakable glory of King Jesus and dismantle the enemy's snares."
  },
  {
    num: 35,
    type: 'SHORT',
    editId: 'dd3f66136d4a254d832b6d74',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/dd3f66136d4a254d832b6d74/preview?review-token=IxmyFXX3L1ap_k3vGz6WgbmidpXuKkPVfpbt70lpeLk',
    hasStar: false,
    title: "BDSM: A Lie About Love",
    ytTags: " #BDSMExposed #BiblicalLove #Deliverance",
    igTags: " #BDSMExposed #BiblicalLove #Deliverance #SexualDeception #CounterfeitIntimacy #TraumaAndDominance #FreedomFromPerversion #SoulTiesBroken #TrueHonor #GodsDesignForSex #InnerHealing #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "BDSM markets dominance, pain, and humiliation as consensual pleasure, but in reality it is a demonic counterfeit of authentic intimacy rooted in trauma and control. God's design for sexual union is mutual honor, self-giving safety, and sacred covenant."
  },
  {
    num: 36,
    type: 'SHORT',
    editId: '0d0566d0c013a9284c927be5',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/0d0566d0c013a9284c927be5/preview?review-token=FjHZ4mxx6a2kjIXguqPmLyHgI_p4NImqeshWwJ2tN7Q',
    hasStar: true,
    title: "Love Your Enemies",
    ytTags: " #LoveYourEnemies #Matthew5 #Christlikeness",
    igTags: " #LoveYourEnemies #Matthew5 #Christlikeness #ForgivingOffenders #UnconditionalLove #HolySpiritPower #CrucifiedLife #SpiritualVictory #OvercomingBitterness #TrueDiscipleship #Deliverance #HeartTransformation #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Loving your enemies is not natural; it is entirely supernatural. Refusing retaliation and interceding for those who oppose you disarms demonic hatred and allows the transforming power of the cross to work within your own soul."
  },
  {
    num: 37,
    type: 'SHORT',
    editId: 'b15cf3ab3d3e47283823fbb7',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/b15cf3ab3d3e47283823fbb7/preview?review-token=hk9RdhuQJWcz2yIe9Qo0IMjx1lbkLcD9pvBaKSdr6c0',
    hasStar: false,
    title: "God's Economy: True Survival",
    ytTags: " #GodsEconomy #KingdomTrust #DivineProvision",
    igTags: " #GodsEconomy #KingdomTrust #DivineProvision #FaithOverFear #OvercomingScarcity #TrustingTheFather #JehovahJireh #Generosity #RighteousLiving #DeliveranceFromGreed #KingdomWealth #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "In times of worldly shaking and scarcity, human hoarding fails. God's economy is sustained by faith, covenant obedience, and kingdom stewardship; those who trust in the Lord will never be abandoned or put to shame."
  },
  {
    num: 38,
    type: 'SHORT',
    editId: '263fdb83096ffd44d7a4f1a3',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/263fdb83096ffd44d7a4f1a3/preview?review-token=BDgaT7YkxoZYh5cbafNj19pdkF66rYA-E6chqWUokaw',
    hasStar: true,
    title: "Repent to Fish for Men",
    ytTags: " #FishersOfMen #TrueRepentance #Evangelism",
    igTags: " #FishersOfMen #TrueRepentance #Evangelism #FollowMe #SoulWinning #GreatCommission #SurrenderedVessel #PreachTheGospel #HolySpiritFire #SpiritualHarvest #Deliverance #Discipleship #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Jesus promised: 'Follow Me, and I will make you fishers of men.' We cannot effectively catch men while entangled in the nets of worldly compromise; radical personal repentance cleanses the vessel to carry the life-giving net of the Gospel."
  },
  {
    num: 39,
    type: 'SHORT',
    editId: '10a957d5c15902f34662c63d',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/10a957d5c15902f34662c63d/preview?review-token=GyEuiSqDiDYXOC9ZbSMrjyez3PKLjwDZso4XpmL8DuQ',
    hasStar: true,
    title: "Repentance: A 180-Degree Turn",
    ytTags: " #BiblicalRepentance #180Turn #Metanoia",
    igTags: " #BiblicalRepentance #180Turn #Metanoia #NewLifeInChrist #TurnFromSin #TurnToGod #MindTransformation #FruitOfRepentance #TrueConversion #CleanSlate #Deliverance #SpiritualAwakening #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Repentance is far more than feeling sorry about consequences—it is a decisive 180-degree turn of mind and direction. Turning your back on rebellion to run full-speed toward Jesus is the only biblical gateway into life and peace."
  },
  {
    num: 40,
    type: 'SHORT',
    editId: 'f609aa9e623c6cdbb04de313',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/f609aa9e623c6cdbb04de313/preview?review-token=Ea9BIZgeLal5CR4Bm3QwCKxKnZGUDTTgz0bitlEGNQ4',
    hasStar: false,
    title: "BDSM: A Culture of Consumption",
    ytTags: " #BDSMDeception #SexualIdolatry #PurityInChrist",
    igTags: " #BDSMDeception #SexualIdolatry #PurityInChrist #Objectification #FalseIntimacy #SoulFragmentation #CarnalAppetites #DeliveranceMinistry #BreakingFetishes #GodsHoliness #RestoredPurity #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Behind the marketing of alternative sexual practices lies a spirit of predatory consumption that devours human dignity. When appetite rules over reverence, the soul is fragmented; Christ calls us out of carnality into holy, honoring relationship."
  },
  {
    num: 41,
    type: 'SHORT',
    editId: 'bf890f948e2a5f124ad69b7c',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/bf890f948e2a5f124ad69b7c/preview?review-token=GuaDeola_71i3JzQOgW9zQH4Vv8mERLBhHDPGzmT1cw',
    hasStar: true,
    title: "Kibbutz: Love & Community",
    ytTags: " #ChristianCommunity #Koinonia #BodyOfChrist",
    igTags: " #ChristianCommunity #Koinonia #BodyOfChrist #TrueFellowship #MutualCare #SharedLife #LoveInAction #EarlyChurch #UnityInChrist #UnselfishLiving #DeliveranceFromIsolation #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Authentic biblical community requires mutual sacrifice, honest accountability, and deep care for one another. Escaping isolated individualism into the shared life of the Body of Christ reflects the true koinonia of the early church."
  },
  {
    num: 42,
    type: 'SHORT',
    editId: '9f5ff60e04ae3bd5029b3362',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/9f5ff60e04ae3bd5029b3362/preview?review-token=Ak4tX2IaYLQEiY2YWEjFiMKjZRVNbXS5kgy-HIMSuHY',
    hasStar: true,
    title: "Rejoice in Persecution",
    ytTags: " #Persecution #Matthew511 #RejoiceInTrials",
    igTags: " #Persecution #Matthew511 #RejoiceInTrials #UnashamedOfGospel #StandingFirm #CrownOfLife #FaithUnderPressure #BoldFaith #BlessedAreThePersecuted #SpiritualEndurance #Deliverance #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Jesus declared that those who are reviled and persecuted for His namesake are truly blessed. When opposition comes because of your stand for truth, do not despair—rejoice and be exceedingly glad, for your reward in heaven is great."
  },
  {
    num: 43,
    type: 'SHORT',
    editId: 'b7802c53cb1f110fed8a3f45',
    url: 'https://riverside.com/editor/758929f4-bb26-4ea6-ba22-edd2de14430b/b7802c53cb1f110fed8a3f45/preview?review-token=sanjXpOKT-BV0wpW5ncCxUQOnAK6XcHrgqP6IH4Keso',
    hasStar: false,
    title: "BDSM: A Lie About Love (Cut 2)",
    ytTags: " #SexualPurity #Deliverance #TruthAboutLove",
    igTags: " #SexualPurity #Deliverance #TruthAboutLove #DeceptionExposed #CleanMind #RestoredHonor #BreakingStrongholds #DeliveranceFromLust #FreedomFromShame #GodsDesign #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Conflating pain with affection is a tragic deception that twists the human heart. Jesus brings deep healing to relational woundedness, dismantling false definitions of intimacy and restoring clean, godly love."
  },
  {
    num: 44,
    type: 'SHORT',
    editId: '74d28b0ad50fcd7e0c9c4281',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/74d28b0ad50fcd7e0c9c4281/preview?review-token=0FFPLra-UbC_mj-bVI7ebfiodZwdPeDP2IW8CciGBEE',
    hasStar: true,
    title: "Discipleship Expectation: Asia's Approach",
    ytTags: " #BiblicalDiscipleship #HighExpectations #UndergroundChurch",
    igTags: " #BiblicalDiscipleship #HighExpectations #UndergroundChurch #CostOfFollowingJesus #SacrificeAndService #GlobalChristianity #FaithWithoutCompromise #CountTheCost #DeepRoots #Deliverance #SpiritualMaturity #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "In regions facing intense persecution, discipleship is neither casual nor self-indulgent; it carries high expectations of total commitment, self-denial, and mutual support. Recovering this apostolic standard shakes Western believers out of shallow complacency."
  },
  {
    num: 45,
    type: 'SHORT',
    editId: '553b18cae238d356565d9d9f',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/553b18cae238d356565d9d9f/preview?review-token=q3vj36rrgdTn4kovhJbXSuyDZh26l-C_G2BlRIYRiA0',
    hasStar: true,
    title: "Jesus on Lust and Adultery",
    ytTags: " #HeartPurity #JesusOnLust #Matthew528",
    igTags: " #HeartPurity #JesusOnLust #Matthew528 #AdulteryOfTheHeart #EyeGate #InternalRighteousness #DeliveranceFromLust #HolyImagination #CleanConscience #OvercomingFlesh #Deliverance #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Jesus elevated the commandment against adultery to the intentions of the heart: looking at another person with lust has already committed adultery in the inner man. Righteousness before God requires guarding the heart and eye-gate with relentless vigilance."
  },
  {
    num: 46,
    type: 'SHORT',
    editId: '7b8e371f081a05734841635f',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/7b8e371f081a05734841635f/preview?review-token=kxJetIBmI6oKxd2sZdMlMjHGJExBccvVwLeqCb3gVv8',
    hasStar: false,
    title: "Voting Values, Not Parties",
    ytTags: " #BiblicalValues #KingdomFirst #ChristianStewardship",
    igTags: " #BiblicalValues #KingdomFirst #ChristianStewardship #MoralConviction #TruthAbovePolitics #RighteousGovernment #GodsStandard #ConscienceClean #BiblicalWorldview #SpiritualDiscernment #Deliverance #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Believers are called to align their civic stewardship with the eternal moral laws of Scripture, not partisan blind allegiance. When biblical values govern our choices, we refuse compromise and stand firmly for righteousness."
  },
  {
    num: 47,
    type: 'SHORT',
    editId: '2686059040fe36876822c8e0',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/2686059040fe36876822c8e0/preview?review-token=BEcHQykwKYllGMHJolcmM1tYLQ3HCIo_gpXMqSXgryM',
    hasStar: false,
    title: "Respecter of Persons in Christianity",
    ytTags: " #NoPartiality #James2 #TrueHumility",
    igTags: " #NoPartiality #James2 #TrueHumility #NoRespecterOfPersons #BiblicalEquality #HumilityInChurch #PureReligion #RejectingStatus #GodLooksAtHeart #SincereFaith #DeliveranceFromPride #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "James warns sternly against showing partiality to the wealthy or influential within the household of faith. God is no respecter of persons; courting status while ignoring the humble offends the righteous character of Christ."
  },
  {
    num: 48,
    type: 'SHORT',
    editId: 'ecfe8b1bfaac5eb79c8dcea0',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/ecfe8b1bfaac5eb79c8dcea0/preview?review-token=MO0sNZrtzXcSPjw5UxcIKnRHGvcMFNwqXsGSTHmoblU',
    hasStar: true,
    title: "Discipleship Beyond Sunday School",
    ytTags: " #DeepDiscipleship #SpiritualMaturity #LivingFaith",
    igTags: " #DeepDiscipleship #SpiritualMaturity #LivingFaith #BeyondReligion #EverydayChristianity #MakingDisciples #SpiritualRoots #WalkingInPower #BiblicalDepth #Deliverance #MindRenewal #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "True discipleship cannot be confined to weekly hour-long routines or superficial curriculum. It is an intentional, everyday life-on-life walk where believers are trained to exercise spiritual authority and obey all that Christ commanded."
  },
  {
    num: 49,
    type: 'SHORT',
    editId: '661d0580a1311eb899b3b884',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/661d0580a1311eb899b3b884/preview?review-token=ULZ_8FAbRTkwPq3QB0p9Ekoixvr217tYpYG8zzPJVSI',
    hasStar: true,
    title: "Lust: Men vs Women",
    ytTags: " #OvercomingLust #GuardingTheHeart #SexualPurity",
    igTags: " #OvercomingLust #GuardingTheHeart #SexualPurity #EmotionalLust #VisualLust #SoulTies #CleanDesires #BiblicalTruth #SpiritualWarfare #DeliveranceMinistry #MindRenewal #FreedomInChrist #Repentance #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "While carnal temptation often manifests visually in men, it frequently traps women through emotional attachment, validation-seeking, and romance fantasy. Both spring from the same lustful root and require deep heart repentance to walk in purity."
  },
  {
    num: 50,
    type: 'SHORT',
    editId: '28de17124e60d85d0991d20f',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/28de17124e60d85d0991d20f/preview?review-token=PL2nGEi_CphAkjwuGktwi6wqAET9fvu7FB-8CMcF5V4',
    hasStar: true,
    title: "Jesus' Radical Teaching on Adultery",
    ytTags: " #RadicalPurity #HeartRighteousness #Matthew5",
    igTags: " #RadicalPurity #HeartRighteousness #Matthew5 #InnerCleansing #GougeOutTheEye #SeveringSin #HolyCommitment #MarriageHonor #CleanThoughts #DeliveranceFromLust #SpiritualDiscipline #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Jesus used the severe metaphor of gouging out an eye or cutting off a hand to show how ruthlessly believers must deal with lust. Compromise in private thoughts eventually produces ruin in physical actions; radical surgery of the heart is mandatory."
  },
  {
    num: 51,
    type: 'SHORT',
    editId: '22356364fb1e5a1e91f17a12',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/22356364fb1e5a1e91f17a12/preview?review-token=qiC89PpcH1zJ1tI4VH72HECY30Yn55Ud7OwncNTHd0o',
    hasStar: true,
    title: "Flee Sexual Immorality",
    ytTags: " #FleeFornication #1Corinthians618 #SexualPurity",
    igTags: " #FleeFornication #1Corinthians618 #SexualPurity #TempleOfTheHolySpirit #RunFromTemptation #JosephFled #HolyLiving #DeliveranceFromLust #PurityWalk #GuardingTheBody #Repentance #SpiritualWarfare #Deliverance #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Scripture does not instruct us to dialogue or negotiate with sexual temptation—it commands us to flee. Every other sin is outside the body, but sexual immorality sins against one's own body, which was bought with a price to be the temple of the Holy Spirit."
  },
  {
    num: 52,
    type: 'SHORT',
    editId: '1c5d92ce39e85c657455cecc',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/1c5d92ce39e85c657455cecc/preview?review-token=4vpUHONny6sqT91xVDIzu-A69jyH9O5Q6n9VD3lBskk',
    hasStar: true,
    title: "Hollywood vs. Biblical View on Intimacy",
    ytTags: " #BiblicalIntimacy #CovenantMarriage #GodsDesign",
    igTags: " #BiblicalIntimacy #CovenantMarriage #GodsDesign #CounterfeitLove #HollywoodDeception #TrueRomance #HolyMarriage #SacredUnion #RestoringHonor #DeliveranceFromWorldliness #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Media culture portrays romance as fickle chemical attraction and disposable gratification, stripping sexuality of covenant protection. Biblical intimacy is grounded in lifelong covenant fidelity, mutual reverence, and godly security."
  },
  {
    num: 53,
    type: 'SHORT',
    editId: 'a52769e4e29a0bfea009b204',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/a52769e4e29a0bfea009b204/preview?review-token=ybP2YAjNubtx7S-jO051V9AhFu7W--HJsEGfw8qGrI4',
    hasStar: false,
    title: "Age of Accountability: Choosing Godly Life",
    ytTags: " #AgeOfAccountability #MoralResponsibility #ChooseGod",
    igTags: " #AgeOfAccountability #MoralResponsibility #ChooseGod #SpiritualMaturity #YouthFaith #ParentalStewardship #ConscienceAwakened #EarlyDiscipleship #RighteousChoices #Deliverance #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "As young people mature into moral awareness, they transition from parental coverage into personal accountability before God. Training youth to willingly choose Christ's commands establishes an enduring anchor against worldly deception."
  },
  {
    num: 54,
    type: 'SHORT',
    editId: '6fd2643e2da723ac1a0452e8',
    url: 'https://riverside.com/editor/e1d9711e-bb1f-4123-9f8a-927daa1d1d34/6fd2643e2da723ac1a0452e8/preview?review-token=k5FcVPBhqqtCrxyrK_dA2U5wEduEAYIFDH0RL1TWMBI',
    hasStar: false,
    title: "Prioritizing Humans Over God",
    ytTags: " #FirstCommandment #NoIdols #GodAboveAll",
    igTags: " #FirstCommandment #NoIdols #GodAboveAll #RelationalIdolatry #FearOfMan #SupremeLordship #WorshipGodAlone #CleanHeart #KingdomFirst #DeliveranceFromIdolatry #Repentance #SpiritualWarfare #Lordship #LivingWordMap #RR2026 #RepentanceProject",
    summary: "Elevating human opinion, family approval, or romantic partners higher than obedience to God is the essence of idolatry. Christ demands our supreme devotion; loving Him first is the only foundation that keeps all earthly relationships healthy."
  },

  // --- SEGMENTS (55 - 74) ---
  {
    num: 55,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c55d31',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c55d31/preview?review-token=xdB0_YubpTNtcL5UoSFEpRw_P2uIJdKWw8VoaNGYHR0',
    hasStar: false,
    title: "The Doormat Culture: A Form of Slavery",
    ytTags: " #DoormatCulture #BiblicalBoundaries #FreedomInChrist",
    summary: "Permitting ungodly abuse, passive victimization, and codependency under the guise of 'humility' creates a destructive doormat culture that functions as emotional slavery. Biblical meekness is not spineless capitulation—it is strength submitted to God with bold discernment."
  },
  {
    num: 56,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c55d20',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c55d20/preview?review-token=pLCHl1fKQAw7Q_vtyk_b8_ODNrUhZg3TZevS35AyNWo',
    hasStar: false,
    title: "Overworking: A Cover for Trauma",
    ytTags: " #Workaholism #TraumaResponse #RestInGod",
    summary: "Compulsive overworking and relentless performance often serve as subconscious mechanisms to evade unresolved grief, childhood neglect, and interior pain. True healing arrives when we slow down, lay our striving at the cross, and find security in our adoption as children of God."
  },
  {
    num: 57,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c55cfa',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c55cfa/preview?review-token=7A3mLrjPf5_t8O49q9OhIXgTVV74eesr7_ry_qPPS-s',
    hasStar: true,
    title: "The Power of Forgiveness",
    ytTags: " #PowerOfForgiveness #InnerHealing #Deliverance",
    summary: "Choosing to forgive offenders breaks spiritual deadlocks and releases God's supernatural healing into poisoned souls. Forgiveness does not minimize evil; it transfers the offender into God's sovereign court while setting the victim completely free."
  },
  {
    num: 58,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c55c0c',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c55c0c/preview?review-token=LvlIhNMMA9xYUCqCz7kFMIWnyAS4kB_IMljO--3AyUs',
    hasStar: true,
    title: "Forgiveness: Letting Go of Offense",
    ytTags: " #LettingGoOfOffense #BaitOfSatan #Forgiveness",
    summary: "Taking offense is the primary trap the enemy uses to divide families, ministries, and churches. Releasing bitter grievances and laying down personal vengeance restores spiritual clarity and safeguards fellowship with the Holy Spirit."
  },
  {
    num: 59,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c5594c',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c5594c/preview?review-token=POtcJIaR7OWPKTE6LUZw-3BWSs0AXq1tLT9KgzUE1VE',
    hasStar: true,
    title: "The Art of Intercession: Kenneth Hagin & Dutch Sheets",
    ytTags: " #ArtOfIntercession #PrevailingPrayer #SpiritualWarfare",
    summary: "Examining historic teachings on intercession reveals that prevailing prayer requires endurance, scriptural grounding, and travailing in the Holy Spirit. Believers standing in the gap shift spiritual atmospheres and release kingdom breakthroughs over entire territories."
  },
  {
    num: 60,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c55945',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c55945/preview?review-token=npcaKDajbSYB_Llfvc5fkXXaOsGta4-U4j_PO8KL6Mo',
    hasStar: false,
    title: "Overcoming Compulsive Desires",
    ytTags: " #OvercomingAddiction #CompulsiveDesire #Deliverance",
    summary: "Uncontrolled compulsions indicate spiritual strongholds and soul wounds demanding satisfaction apart from God. Victorious deliverance requires unmasking the root lie, submitting carnal appetites to Christ, and walking in continuous accountability."
  },
  {
    num: 61,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c55939',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c55939/preview?review-token=dZRqlqHnh7cS9h5o0chDLZx7YZmaNKMR62qoWnN2X2A',
    hasStar: true,
    title: "Discovering the Power of Prayer",
    ytTags: " #PowerOfPrayer #SpiritualAuthority #CommunionWithGod",
    summary: "Prayer is not religious ritual; it is accessing heaven's throne room to partner with God in His redemptive plans. When believers lay hold of their authority in Christ, prayer becomes vibrant, powerful, and world-changing."
  },
  {
    num: 62,
    type: 'SEGMENT',
    editId: '6aa2dd64aeb8b7f332c55933',
    url: 'https://riverside.com/editor/7812baee-9afd-49a8-97ee-6934e829271c/6aa2dd64aeb8b7f332c55933/preview?review-token=3-HcaUrMnYaHCn0Ve50H7KTzw4JccaCmBKXrGa9Txxk',
    hasStar: true,
    title: "Pray Without Ceasing: A God-Minded Life",
    ytTags: " #PrayWithoutCeasing #GodMindedness #AbidingInChrist",
    summary: "Maintaining an ongoing, unbroken awareness of God transforms mundane tasks into holy service. Cultivating continuous communion with Christ anchors the believer in unshakeable peace amidst life's daily pressures."
  },
  {
    num: 63,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c8175e2',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c8175e2/preview?review-token=MYGH6d9x1zaBr5wYbQTeK4gVbpXHjNQjWsWptjmPDTQ',
    hasStar: true,
    title: "The Priority of the Kingdom",
    ytTags: " #KingdomPriority #Matthew633 #DivineOrder",
    summary: "Seeking first the Kingdom of God reorders every priority, eliminating anxious worldly striving. When Christ is granted supreme preeminence, His righteous government orders our steps and supplies all our needs."
  },
  {
    num: 64,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c8175e2',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c8175e2/preview?review-token=MYGH6d9x1zaBr5wYbQTeK4gVbpXHjNQjWsWptjmPDTQ',
    hasStar: false,
    duplicateOf: 63,
    title: "The Priority of the Kingdom (Duplicate)",
    ytTags: " #KingdomPriority #Matthew633 #DivineOrder",
    summary: "Seeking first the Kingdom of God reorders every priority, eliminating anxious worldly striving. When Christ is granted supreme preeminence, His righteous government orders our steps and supplies all our needs."
  },
  {
    num: 65,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c8175cc',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c8175cc/preview?review-token=TTMt9md6LmZ_3E_UurpDh1pxMw0abPKoiVh3vx4Chpk',
    hasStar: false,
    title: "Overcoming Obsession with Failure",
    ytTags: " #VictoryOverDefeat #FreedomFromFear #FaithInGod",
    summary: "Dwelling endlessly upon previous shortcomings produces paralyzing self-condemnation. Believers must actively renew their minds in God's mercy, leaving behind the baggage of failure to press forward in the high calling of God."
  },
  {
    num: 66,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c8175c6',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c8175c6/preview?review-token=nufj8WUs30beHXDWofMio56HQos3YxWv1gdNwc0JoH4',
    hasStar: true,
    title: "Love Your Enemies: A Call to Mercy",
    ytTags: " #LoveYourEnemies #CallToMercy #OvercomingEvil",
    summary: "Jesus calls His followers to an uncompromising ethic of mercy that blesses enemies and prays for persecutors. Radical mercy breaks demonic cycles of vengeance and demonstrates the supernatural power of the Kingdom of God."
  },
  {
    num: 67,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c8175c6',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c8175c6/preview?review-token=nufj8WUs30beHXDWofMio56HQos3YxWv1gdNwc0JoH4',
    hasStar: true,
    duplicateOf: 66,
    title: "Love Your Enemies: A Call to Mercy (Duplicate)",
    ytTags: " #LoveYourEnemies #CallToMercy #OvercomingEvil",
    summary: "Jesus calls His followers to an uncompromising ethic of mercy that blesses enemies and prays for persecutors. Radical mercy breaks demonic cycles of vengeance and demonstrates the supernatural power of the Kingdom of God."
  },
  {
    num: 68,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c81757c',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c81757c/preview?review-token=dMrCrNwxOHEneE7XKlyV-iTCL95ZePQkBoVerusfWw8',
    hasStar: false,
    title: "Avoiding Matthew 6:33: The Consequences",
    ytTags: " #Matthew633 #KingdomConsequences #TrustGod",
    summary: "Relegating God's Kingdom to second place produces chronic anxiety, financial bondage, and spiritual futility. Ignoring Christ's divine priority leaves the soul vulnerable to worldly traps, while seeking Him first brings guaranteed provision."
  },
  {
    num: 69,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c817576',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c817576/preview?review-token=0r12hSaxLyNJT6eyKCRHZ8AbAV4SQtqdajQw2UqB6LM',
    hasStar: false,
    title: "Christianity: Not Self-Improvement, But Citizenship",
    ytTags: " #KingdomCitizenship #TrueConversion #Lordship",
    summary: "The Gospel is not an inspirational system for self-actualization; it is naturalization into the Kingdom of God through spiritual rebirth. True believers bow before Christ as King, renouncing self-rule to live under the laws of heaven."
  },
  {
    num: 70,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c817570',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c817570/preview?review-token=tiAWmIrhb8Iy01g2T3Zu9S2HhjwnXDJ3mfMR5xaiAm4',
    hasStar: false,
    title: "Doubt: Choosing Not to Believe",
    ytTags: " #OvercomingUnbelief #RootOfDoubt #FaithInAction",
    summary: "Persistent unbelief is not merely an intellectual struggle, but a heart posture that prefers autonomy over surrender. Overcoming doubt begins with honest repentance, choosing to believe God's Word above our feelings and skepticism."
  },
  {
    num: 71,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c81756a',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c81756a/preview?review-token=VYl3MdNpsaKjPsm-32ZlIlwOTQJAuWGzmpu9Sf9Mw6M',
    hasStar: false,
    title: "The Integral Word: Kingdom & Righteousness",
    ytTags: " #KingdomAndRighteousness #WordOfGod #Holiness",
    summary: "God's Kingdom cannot be separated from His righteous standard of holiness and truth. Embracing the complete counsel of Scripture purges compromise and establishes the believer in genuine spiritual authority."
  },
  {
    num: 72,
    type: 'SEGMENT',
    editId: '6aa2dd461a67fc763c8174e7',
    url: 'https://riverside.com/editor/513a0d2f-e2b2-41f4-951f-4229bce46f7e/6aa2dd461a67fc763c8174e7/preview?review-token=keAWCNffz0CDdvVIpWQ3cxcLhq21Hp5-JhtkFRzhS4c',
    hasStar: true,
    title: "Love Your Enemies: A Personal Story",
    ytTags: " #LoveYourEnemies #PersonalTestimony #OvercomingHatred",
    summary: "Personal testimony reveals that forgiving severe mistreatment and actively loving enemies is only possible through the Holy Spirit's supernatural power. Choosing to release offenses brings liberation from bitterness and unlocks relational reconciliation."
  },
  {
    num: 73,
    type: 'SEGMENT',
    editId: '6aa2dcccfd161b184fba7bc4',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dcccfd161b184fba7bc4/preview?review-token=v7vAxm5qpdyDTiXJ2_CYTCDkcN0ywWNponwvrMvf84Y',
    hasStar: true,
    title: "Incest Laws: A Global Perspective",
    ytTags: " #MoralBoundaries #SanctityOfFamily #BiblicalPurity",
    summary: "Examining societal laws alongside biblical boundaries demonstrates how God's holy commandments protect the sanctity and safety of the home. Rejecting God's moral boundaries invites generational devastation; adhering to His laws brings safety and life."
  },
  {
    num: 74,
    type: 'SEGMENT',
    editId: '6aa2dcccfd161b184fba7bbe',
    url: 'https://riverside.com/editor/2615c996-2376-469c-9bb9-b7ce6ef91f29/6aa2dcccfd161b184fba7bbe/preview?review-token=YcfrOlz_D7a0pdDwZH7IxnHlWRetThKv770zjcnkLjM',
    hasStar: true,
    title: "Words Matter: Honesty and Integrity",
    ytTags: " #WordsMatter #Integrity #Truthfulness",
    summary: "Scripture warns that life and death reside in the power of the tongue. Believers are summoned to rigorous honesty and trustworthy speech, reflecting the holy character of the God who cannot lie."
  }
];

const sharedFooter = '#RepentanceProject #PrayerTopics #LivingWordMap #RR2026 #Deliverance #SpiritualWarfare #Principalities #Repentance https://map.repentance101.com';
const starLink = 'https://mtfamilyfellowship.com/';

// Compute staggered scheduledAt
const baseDateMs = Date.parse('2026-09-12T21:05:00Z');
const intervalMs = 864 * 1000;

let uniquePublishCount = 0;
const processedItems = items.map(item => {
  if (item.duplicateOf) {
    return {
      ...item,
      isDuplicate: true,
      scheduledAt: null
    };
  }
  const scheduledTime = new Date(baseDateMs + (uniquePublishCount * intervalMs)).toISOString();
  uniquePublishCount++;
  return {
    ...item,
    isDuplicate: false,
    scheduledAt: scheduledTime
  };
});

console.log(`Prepared ${processedItems.length} items (${uniquePublishCount} unique uploads to schedule).`);

// Generate upload-metadata-notepad.txt contents
const lines = [
  '8-31 / 9-12 R&R upload metadata — copy fields into YouTube / Instagram when you post the paired export.',
  'For each link that starts with "*" add https://mtfamilyfellowship.com/ to the description.',
  ''
];

for (const it of processedItems) {
  lines.push('================================================================================');
  if (it.type === 'SHORT') {
    lines.push(`[${it.num}] SHORT`);
    lines.push(`Link: ${it.url}`);
    lines.push('');
    lines.push('TITLE');
    lines.push(it.title);
    lines.push('');
    lines.push('YOUTUBE HASHTAGS');
    lines.push(it.ytTags);
    lines.push('');
    lines.push('INSTAGRAM HASHTAGS');
    lines.push(it.igTags);
    lines.push('');
    lines.push('SUMMARY');
    lines.push(it.summary);
    lines.push('');
    if (it.hasStar) {
      lines.push(starLink);
      lines.push('');
    }
    lines.push(sharedFooter);
    lines.push('');
  } else {
    lines.push(`[${it.num}] YOUTUBE SEGMENT${it.isDuplicate ? ' (DUPLICATE)' : ''}`);
    lines.push(`Link: ${it.url}`);
    lines.push('');
    lines.push('TITLE');
    lines.push(it.title);
    lines.push('');
    lines.push('YOUTUBE HASHTAGS');
    lines.push(it.ytTags);
    lines.push('');
    lines.push('SUMMARY');
    lines.push(it.summary);
    lines.push('');
    if (it.hasStar) {
      lines.push(starLink);
      lines.push('');
    }
    lines.push(sharedFooter);
    lines.push('');
  }
}

fs.writeFileSync(outPath, lines.join('\r\n'), 'utf8');
console.log(`Wrote formatted metadata to ${outPath}`);

// Write the queue file for publishing execution
fs.writeFileSync(queuePath, JSON.stringify(processedItems, null, 2), 'utf8');
console.log(`Wrote queue to ${queuePath}`);
