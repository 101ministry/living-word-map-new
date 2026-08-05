# Generate data/DEPORTATION-STATUTES-COUNTRIES.json
$ErrorActionPreference = 'Stop'
$Out = Join-Path (Split-Path $PSScriptRoot -Parent) 'data/DEPORTATION-STATUTES-COUNTRIES.json'

$countries = @(
@{
  name='United States'; wjpRank='27'; wjpScore='0.68'
  officialReligionShort='None (secular)'; practiceShort='~64% Christian; ~29% unaffiliated'
  officialReligion='No established religion. First Amendment: Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof.'
  officialSource='https://www.archives.gov/founding-docs/bill-of-rights-transcript'
  practiceReligion='Christian 64%; unaffiliated 29%; Jewish 2%; Muslim 1%; Hindu 1%; Buddhist 1%; other 2% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Constitutionally secular; population remains majority Christian with growing unaffiliated share.'
  axes=@{life='Y';justice='P';sojourner='P';oneLaw='P';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Partial'
  verdict='Strong statutory protection for life, free exercise, and lawful authority, but impartial justice and sojourner fairness vary by enforcement. Immigration law is complex and sometimes punitive relative to Lev 19/Num 15 analogs.'
  statutes=@(
    @{axis='Life';note='Murder and manslaughter federally and in all states';cite='18 U.S.C. Sec. 1111 (Murder)';url='https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title18-section1111'}
    @{axis='Justice';note='Federal bribery of public officials criminalized';cite='18 U.S.C. Sec. 201 (Bribery of public officials)';url='https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title18-section201'}
    @{axis='Sojourner';note='Asylum and withholding of removal for qualifying aliens';cite='8 U.S.C. Sec. 1158 (Asylum)';url='https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title8-section1158'}
    @{axis='One law';note='General immigration and nationality framework';cite='8 U.S.C. Sec. 1101 et seq. (INA)';url='https://uscode.house.gov/view.xhtml?path=/prelim@title8&edition=prelim'}
    @{axis='Truth';note='Perjury before federal courts or grand jury';cite='18 U.S.C. Sec. 1621 (Perjury generally)';url='https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title18-section1621'}
    @{axis='Security';note='Inadmissibility and removal for security-related grounds';cite='8 U.S.C. Sec. 1182(a)(3) (Security grounds)';url='https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title8-section1182'}
  )
},
@{
  name='China'; wjpRank='92'; wjpScore='0.48'
  officialReligionShort='Atheist state (CCP)'; practiceShort='~52% unaffiliated; ~18% Buddhist; ~5% Christian'
  officialReligion='Constitution guarantees freedom of religious belief but subordinates religion to state supervision; CCP promotes atheism and registers permitted religious activity.'
  officialSource='https://www.npc.gov.cn/npc/c30834/2021030516025689013.shtml'
  practiceReligion='Unaffiliated 52%; folk religion 21%; Buddhist 18%; Christian 5%; Muslim 2%; other 2% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Official atheist supervision vs substantial Buddhist, folk, and underground Christian practice.'
  axes=@{life='P';justice='N';sojourner='N';oneLaw='P';child='P';sexual='P';authority='Y';religion='N';truth='N';security='Y'}
  overall='Weak'
  verdict='Criminal law punishes killing but party-controlled courts undermine impartial justice. Religious practice is regulated and suppressed; sojourner and truth protections are weak relative to biblical norms.'
  statutes=@(
    @{axis='Life';note='Intentional homicide criminally punished';cite='Criminal Law of the PRC, Art. 232 (Intentional homicide)';url='http://www.npc.gov.cn/npc/c30834/2021030516025689013.shtml'}
    @{axis='Authority';note='State organs exercise public power under Constitution';cite='Constitution of the PRC, Art. 57 (NPC authority)';url='http://www.npc.gov.cn/npc/c30834/2021030516025689013.shtml'}
    @{axis='Religion';note='Religious affairs under state administration';cite='Regulations on Religious Affairs (2017)';url='https://www.china-briefing.com/news/the-new-regulations-on-religious-affairs-2017-explained/'}
    @{axis='One law';note='Exit and entry administration for foreigners';cite='Exit and Entry Administration Law of the PRC';url='http://www.npc.gov.cn/npc/c30834/2021030516025689013.shtml'}
    @{axis='Security';note='State security and counter-espionage framework';cite='Counter-Espionage Law of the PRC (2014)';url='http://www.npc.gov.cn/npc/c30834/2021030516025689013.shtml'}
  )
},
@{
  name='India'; wjpRank='86'; wjpScore='0.49'
  officialReligionShort='Secular (no state religion)'; practiceShort='~80% Hindu; ~14% Muslim; ~2% Christian'
  officialReligion='Constitution declares India a sovereign socialist secular democratic republic; no state religion; freedom of conscience and religion guaranteed.'
  officialSource='https://www.india.gov.in/my-government/constitution-india/constitution-india-full-text'
  practiceReligion='Hindu 79.8%; Muslim 14.2%; Christian 2.3%; Sikh 1.7%; Buddhist 0.7%; Jain 0.4%; other 0.9% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution vs Hindu-majority practice and periodic communal tension.'
  axes=@{life='Y';justice='P';sojourner='P';oneLaw='P';child='P';sexual='P';authority='Y';religion='P';truth='P';security='Y'}
  overall='Mixed'
  verdict='IPC retains strong life and truth statutes, but court delays and uneven enforcement weaken justice. Secular pluralism aligns on paper; sojourner protection is partial for refugees and migrants.'
  statutes=@(
    @{axis='Life';note='Murder punishable with death or life imprisonment';cite='Indian Penal Code, Sec. 302 (Murder)';url='https://www.indiacode.nic.in/handle/123456789/2263'}
    @{axis='Justice';note='Bribery of public servants criminalized';cite='Prevention of Corruption Act, 1988';url='https://www.indiacode.nic.in/handle/123456789/1362'}
    @{axis='Sojourner';note='Foreigners registration and visa framework';cite='Foreigners Act, 1946';url='https://www.indiacode.nic.in/handle/123456789/1362'}
    @{axis='One law';note='Citizenship and naturalization rules';cite='Citizenship Act, 1955';url='https://www.indiacode.nic.in/handle/123456789/1362'}
    @{axis='Truth';note='False evidence and perjury offenses';cite='Indian Penal Code, Sec.Sec. 191-193 (False evidence)';url='https://www.indiacode.nic.in/handle/123456789/2263'}
    @{axis='Religion';note='Freedom of religion with conversion restrictions in some states';cite='Constitution of India, Art. 25 (Freedom of religion)';url='https://www.india.gov.in/my-government/constitution-india/constitution-india-full-text'}
  )
},
@{
  name='Indonesia'; wjpRank='69'; wjpScore='0.52'
  officialReligionShort='Pancasila (not one faith)'; practiceShort='~87% Muslim; ~7% Christian'
  officialReligion='Pancasila requires belief in one God but constitution guarantees freedom of religion; state recognizes six official religions.'
  officialSource='https://www.kemenkumham.go.id/undang-undang-dasar-1945'
  practiceReligion='Muslim 86.7%; Christian 7.6%; Hindu 1.7%; Buddhist 0.7%; folk 2.4%; other 0.9% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Official pluralism under Pancasila vs overwhelming Muslim practice.'
  axes=@{life='Y';justice='P';sojourner='P';oneLaw='P';child='Y';sexual='P';authority='Y';religion='P';truth='P';security='Y'}
  overall='Mixed'
  verdict='Criminal code protects life and punishes perjury; sharia-inspired regional rules create mixed sexual-order and religion outcomes. Sojourner law exists but enforcement is uneven.'
  statutes=@(
    @{axis='Life';note='Intentional killing punishable by death or imprisonment';cite='Law No. 1/2023 (Criminal Code), Art. on murder';url='https://www.kemenkumham.go.id/'}
    @{axis='Justice';note='Corruption of public officials criminalized';cite='Law No. 31/1999 on Eradication of Corruption';url='https://www.kemenkumham.go.id/'}
    @{axis='Sojourner';note='Immigration and foreign nationals residence';cite='Law No. 6/2011 on Immigration';url='https://www.kemenkumham.go.id/'}
    @{axis='Religion';note='Religious harmony and blasphemy provisions';cite='Law No. 1/PNPS/1965 on Blasphemy';url='https://www.kemenkumham.go.id/'}
    @{axis='Truth';note='False testimony in court criminalized';cite='Criminal Code provisions on false testimony';url='https://www.kemenkumham.go.id/'}
  )
},
@{
  name='Pakistan'; wjpRank='130'; wjpScore='0.37'
  officialReligionShort='Islam (state religion)'; practiceShort='~96% Muslim'
  officialReligion='Constitution names Islam as state religion; President and Prime Minister must be Muslims; freedom of religion subject to law and public order.'
  officialSource='https://www.pakistani.org/pakistan/constitution/'
  practiceReligion='Muslim 96.4%; Hindu 2.1%; Christian 1.3%; other 0.2% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Established Islam in law vs small Christian and Hindu minorities in practice.'
  axes=@{life='P';justice='N';sojourner='N';oneLaw='P';child='P';sexual='N';authority='Y';religion='N';truth='N';security='Y'}
  overall='Weak'
  verdict='Blasphemy and apostasy pressures conflict with free exercise norms. Life is criminalized in statute but honor killings and mob violence undermine Gen 9 alignment.'
  statutes=@(
    @{axis='Life';note='Qisas and Diyat framework for homicide';cite='Pakistan Penal Code, Sec. 302 (Murder)';url='https://www.pakistani.org/pakistan/legislation/1860/actXLVof1860.html'}
    @{axis='Religion';note='Blasphemy offenses against Islam';cite='Pakistan Penal Code, Sec. 295-C (Blasphemy)';url='https://www.pakistani.org/pakistan/legislation/1860/actXLVof1860.html'}
    @{axis='Authority';note='Executive and legislative structure under Constitution';cite='Constitution of Pakistan, Part III (Federation)';url='https://www.pakistani.org/pakistan/constitution/'}
    @{axis='One law';note='Foreigners Act registration and deportation';cite='Foreigners Act, 1946 (Pakistan)';url='https://www.pakistani.org/pakistan/legislation/'}
    @{axis='Security';note='Anti-terrorism and security courts';cite='Anti-Terrorism Act, 1997';url='https://www.pakistani.org/pakistan/legislation/'}
  )
},
@{
  name='Brazil'; wjpRank='78'; wjpScore='0.50'
  officialReligionShort='Secular state'; practiceShort='~88% Christian (mostly Catholic)'
  officialReligion='1988 Constitution establishes secular state; prohibits federal support or hindrance of any religion; free exercise guaranteed.'
  officialSource='https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm'
  practiceReligion='Christian 88.1% (Catholic 64.6%, Protestant 22.2%); unaffiliated 8.0%; other 3.9% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution vs historically Catholic-majority society.'
  axes=@{life='Y';justice='P';sojourner='P';oneLaw='P';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Partial'
  verdict='Penal Code strongly criminalizes homicide and perjury; secular religious freedom aligns with Ex 20 analog. Justice delays and prison conditions weaken impartial courts.'
  statutes=@(
    @{axis='Life';note='Homicide punishable by imprisonment';cite='Decreto-Lei 2.848/1940 (Penal Code), Art. 121';url='http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848.htm'}
    @{axis='Justice';note='Crimes against public administration';cite='Penal Code, Art. 312-337 (Crimes by public officials)';url='http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848.htm'}
    @{axis='Religion';note='Secular state and free exercise';cite='Constituicao Federal, Art. 5(VI) (Freedom of conscience)';url='https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm'}
    @{axis='Sojourner';note='Foreigner registration and deportation';cite='Lei 6.815/1980 (Estatuto do Estrangeiro)';url='http://www.planalto.gov.br/ccivil_03/leis/l6815.htm'}
    @{axis='Truth';note='False testimony criminalized';cite='Penal Code, Art. 342 (False testimony)';url='http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848.htm'}
  )
},
@{
  name='Nigeria'; wjpRank='120'; wjpScore='0.41'
  officialReligionShort='Secular (dual sharia/civil)'; practiceShort='~49% Christian; ~49% Muslim'
  officialReligion='Secular federal constitution; no state religion; sharia courts operate in northern states for Muslims in personal law.'
  officialSource='https://www.nigeria-law.org/ConstitutionOfTheFederalRepublicOfNigeria.htm'
  practiceReligion='Christian 48.9%; Muslim 48.8%; folk 1.4%; other 0.9% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular federal frame vs near-even Christian-Muslim split and regional sharia.'
  axes=@{life='P';justice='N';sojourner='N';oneLaw='P';child='P';sexual='N';authority='P';religion='P';truth='N';security='P'}
  overall='Weak'
  verdict='Federal criminal law punishes murder but communal violence and corruption erode justice. Dual legal systems produce mixed religious and sexual-order outcomes.'
  statutes=@(
    @{axis='Life';note='Murder and manslaughter under Criminal Code';cite='Criminal Code Act, Sec. 319 (Murder)';url='https://www.nigeria-law.org/Criminal%20Code%20Act-Tables/Criminal%20Code%20Act.htm'}
    @{axis='Justice';note='Corrupt practices and bribery';cite='Corrupt Practices and Other Related Offences Act, 2000';url='https://www.nigeria-law.org/'}
    @{axis='Religion';note='Freedom of religion and worship';cite='Constitution of Nigeria, Sec. 38 (Freedom of religion)';url='https://www.nigeria-law.org/ConstitutionOfTheFederalRepublicOfNigeria.htm'}
    @{axis='One law';note='Immigration Act residence and deportation';cite='Immigration Act, 2015';url='https://www.nigeria-law.org/'}
    @{axis='Security';note='Terrorism prevention Act';cite='Terrorism (Prevention) Act, 2011';url='https://www.nigeria-law.org/'}
  )
},
@{
  name='Bangladesh'; wjpRank='125'; wjpScore='0.39'
  officialReligionShort='Secular (Islam privileged)'; practiceShort='~90% Muslim; ~9% Hindu'
  officialReligion='Constitution declares Bangladesh a secular republic but retains Islam as state religion (15th Amendment tension); freedom of religion guaranteed.'
  officialSource='https://bdlaws.minlaw.gov.bd/act-367.html'
  practiceReligion='Muslim 90.4%; Hindu 8.5%; Buddhist 0.6%; Christian 0.3%; other 0.2% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular wording with established Islam vs Hindu minority practice.'
  axes=@{life='P';justice='N';sojourner='N';oneLaw='P';child='P';sexual='P';authority='Y';religion='N';truth='N';security='Y'}
  overall='Weak'
  verdict='Penal Code retains life and truth statutes but blasphemy and digital security laws suppress religious speech. Sojourner Rohingya population faces precarious status.'
  statutes=@(
    @{axis='Life';note='Murder punishable by death or life';cite='Penal Code, Sec. 302 (Murder)';url='https://bdlaws.minlaw.gov.bd/act-367.html'}
    @{axis='Religion';note='Blasphemy and hurting religious feelings';cite='Penal Code, Sec. 295A (Deliberate religious outrage)';url='https://bdlaws.minlaw.gov.bd/act-367.html'}
    @{axis='One law';note='Foreigners registration and visa rules';cite='Foreigners Act, 1946 (Bangladesh)';url='https://bdlaws.minlaw.gov.bd/'}
    @{axis='Truth';note='False evidence and perjury';cite='Penal Code, Sec.Sec. 191-193';url='https://bdlaws.minlaw.gov.bd/act-367.html'}
    @{axis='Security';note='Digital Security Act broad offenses';cite='Digital Security Act, 2018';url='https://bdlaws.minlaw.gov.bd/'}
  )
},
@{
  name='Russia'; wjpRank='119'; wjpScore='0.41'
  officialReligionShort='Secular (Orthodox favored)'; practiceShort='~73% Orthodox; ~15% unaffiliated'
  officialReligion='Constitution declares secular state and equality of religions; Russian Orthodox Church holds privileged public role without formal establishment.'
  officialSource='http://www.constitution.ru/en/russia/constitution/'
  practiceReligion='Christian 73.6% (Orthodox 71.8%); Muslim 6.5%; unaffiliated 15.0%; Buddhist 0.5%; other 4.4% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution vs Orthodox cultural dominance and state favoritism.'
  axes=@{life='Y';justice='N';sojourner='N';oneLaw='P';child='Y';sexual='N';authority='Y';religion='N';truth='N';security='Y'}
  overall='Weak'
  verdict='Criminal Code punishes murder but political prosecutions undermine impartial justice. Foreign-agent and extremism laws suppress religious minorities and speech.'
  statutes=@(
    @{axis='Life';note='Intentional murder criminalized';cite='Criminal Code of the RF, Art. 105 (Murder)';url='http://www.consultant.ru/document/cons_doc_LAW_10699/'}
    @{axis='Justice';note='Abuse of official powers';cite='Criminal Code, Art. 285 (Abuse of powers)';url='http://www.consultant.ru/document/cons_doc_LAW_10699/'}
    @{axis='Religion';note='Freedom of conscience and religious associations';cite='Federal Law No. 125-FZ on Freedom of Conscience';url='http://www.consultant.ru/document/cons_doc_LAW_8945/'}
    @{axis='One law';note='Migration registration and residence rules';cite='Federal Law No. 109-FZ on Migration Registration';url='http://www.consultant.ru/document/cons_doc_LAW_60799/'}
    @{axis='Security';note='Counter-extremism and undesirable organizations';cite='Federal Law No. 114-FZ on Countering Extremism';url='http://www.consultant.ru/document/cons_doc_LAW_10699/'}
  )
},
@{
  name='Mexico'; wjpRank='121'; wjpScore='0.40'
  officialReligionShort='Secular state'; practiceShort='~88% Christian (mostly Catholic)'
  officialReligion='Constitution establishes secular state; prohibits establishment; guarantees free exercise; clergy barred from holding certain public offices.'
  officialSource='https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf'
  practiceReligion='Christian 88.0% (Catholic 77.7%, Protestant 8.3%); unaffiliated 8.1%; other 3.9% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Hard secularism in law vs Catholic-majority culture.'
  axes=@{life='P';justice='N';sojourner='P';oneLaw='P';child='P';sexual='P';authority='P';religion='Y';truth='N';security='P'}
  overall='Weak'
  verdict='Federal penal law criminalizes homicide but cartel violence overwhelms security. Secular religious freedom aligns; justice and truth enforcement remain weak.'
  statutes=@(
    @{axis='Life';note='Homicide punishable under federal and state codes';cite='Codigo Penal Federal, Art. 302 (Homicidio)';url='https://www.diputados.gob.mx/LeyesBiblio/pdf/CPF.pdf'}
    @{axis='Religion';note='Secular state and free exercise';cite='Constitucion Politica, Art. 130 (Religious associations)';url='https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf'}
    @{axis='Sojourner';note='Migration law and refugee protection';cite='Ley de Migracion';url='https://www.diputados.gob.mx/LeyesBiblio/pdf/LMigra.pdf'}
    @{axis='One law';note='Nationality and naturalization';cite='Ley de Nacionalidad';url='https://www.diputados.gob.mx/LeyesBiblio/'}
    @{axis='Truth';note='Perjury and false testimony';cite='Codigo Penal Federal, Art. 247 (Perjurio)';url='https://www.diputados.gob.mx/LeyesBiblio/pdf/CPF.pdf'}
  )
},
@{
  name='Japan'; wjpRank='15'; wjpScore='0.78'
  officialReligionShort='Secular (no state religion)'; practiceShort='~57% syncretic; ~27% unaffiliated'
  officialReligion='Constitution guarantees freedom of religion; state and religion strictly separated; no religious test for office.'
  officialSource='https://www.japaneselawtranslation.go.jp/en/laws/view/4012/en'
  practiceReligion='Unaffiliated 27.0%; Buddhist 36.2%; Shinto 16.9%; Christian 1.5%; folk 18.4% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Constitutional secularism vs widespread Shinto-Buddhist syncretic practice.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Strong'
  verdict='Penal Code rigorously criminalizes homicide and perjury; courts rank high on impartiality. Immigration is orderly but strict on sojourner integration relative to ger model.'
  statutes=@(
    @{axis='Life';note='Murder punishable by death or life imprisonment';cite='Penal Code of Japan, Art. 199 (Murder)';url='https://www.japaneselawtranslation.go.jp/en/laws/view/3171/en'}
    @{axis='Justice';note='Bribery of public officials';cite='Penal Code, Art. 197 (Bribery)';url='https://www.japaneselawtranslation.go.jp/en/laws/view/3171/en'}
    @{axis='Religion';note='Freedom of religion guaranteed';cite='Constitution of Japan, Art. 20 (Freedom of religion)';url='https://www.japaneselawtranslation.go.jp/en/laws/view/4012/en'}
    @{axis='One law';note='Immigration Control and Refugee Recognition Act';cite='Immigration Control and Refugee Recognition Act';url='https://www.japaneselawtranslation.go.jp/en/laws/view/3109/en'}
    @{axis='Truth';note='Perjury in official proceedings';cite='Penal Code, Art. 169 (Perjury)';url='https://www.japaneselawtranslation.go.jp/en/laws/view/3171/en'}
    @{axis='Security';note='Subversive Activities Prevention Act';cite='Subversive Activities Prevention Act';url='https://www.japaneselawtranslation.go.jp/en/laws/view/3109/en'}
  )
},
@{
  name='Ethiopia'; wjpRank='132'; wjpScore='0.36'
  officialReligionShort='Secular (religions equal)'; practiceShort='~63% Christian; ~34% Muslim'
  officialReligion='Constitution provides for secular state, freedom of religion, and equality of faiths; no state religion.'
  officialSource='https://www.wipo.int/wipolex/en/legislation/details/13085'
  practiceReligion='Christian 62.8% (Orthodox 43.8%, Protestant 18.6%); Muslim 33.9%; folk 2.6%; other 0.7% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular equality in law vs Orthodox and Muslim regional concentrations.'
  axes=@{life='P';justice='N';sojourner='N';oneLaw='P';child='P';sexual='P';authority='P';religion='P';truth='N';security='P'}
  overall='Weak'
  verdict='Criminal code retains life statutes but ethnic conflict and detention practices undermine justice. Religious freedom on paper; communal violence creates mixed enforcement.'
  statutes=@(
    @{axis='Life';note='Crime of homicide under Criminal Code';cite='Ethiopian Criminal Code, Art. 530 (Homicide)';url='https://www.wipo.int/wipolex/en/legislation/details/13085'}
    @{axis='Religion';note='Freedom of religion and worship';cite='Constitution of Ethiopia, Art. 27 (Freedom of religion)';url='https://www.wipo.int/wipolex/en/legislation/details/13085'}
    @{axis='One law';note='Proclamation on immigration and citizenship';cite='Ethiopian Immigration Proclamation No. 354/2003';url='https://www.wipo.int/wipolex/en/legislation/details/13085'}
    @{axis='Authority';note='Federal democratic republic structure';cite='Constitution of Ethiopia, Art. 1 (Nomenclature)';url='https://www.wipo.int/wipolex/en/legislation/details/13085'}
    @{axis='Security';note='Anti-Terrorism Proclamation';cite='Anti-Terrorism Proclamation No. 652/2009';url='https://www.wipo.int/wipolex/en/legislation/details/13085'}
  )
},
@{
  name='Philippines'; wjpRank='97'; wjpScore='0.46'
  officialReligionShort='Secular (Catholic history)'; practiceShort='~89% Christian (mostly Catholic)'
  officialReligion='Constitution separates church and state; free exercise guaranteed; no state religion.'
  officialSource='https://www.officialgazette.gov.ph/constitutions/the-1987-constitution-of-the-republic-of-the-philippines/'
  practiceReligion='Christian 89.1% (Catholic 78.8%, Protestant 8.2%); Muslim 6.4%; folk 2.5%; other 2.0% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution vs Catholic-majority practice and Muslim south.'
  axes=@{life='P';justice='N';sojourner='P';oneLaw='P';child='P';sexual='P';authority='Y';religion='Y';truth='P';security='P'}
  overall='Mixed'
  verdict='Revised Penal Code criminalizes murder and perjury but drug-war killings and corruption erode life and justice alignment. Secular religious freedom largely upheld.'
  statutes=@(
    @{axis='Life';note='Murder and homicide under RPC';cite='Revised Penal Code, Art. 248 (Murder)';url='https://www.officialgazette.gov.ph/1993/12/06/republic-act-no-8353/'}
    @{axis='Religion';note='Free exercise and non-establishment';cite='1987 Constitution, Art. III Sec. 5 (Free exercise)';url='https://www.officialgazette.gov.ph/constitutions/the-1987-constitution-of-the-republic-of-the-philippines/'}
    @{axis='Sojourner';note='Alien registration and deportation';cite='Philippine Immigration Act of 1940';url='https://www.officialgazette.gov.ph/'}
    @{axis='Truth';note='Perjury in judicial proceedings';cite='Revised Penal Code, Art. 183 (Perjury)';url='https://www.officialgazette.gov.ph/1993/12/06/republic-act-no-8353/'}
    @{axis='One law';note='Citizenship and naturalization';cite='Commonwealth Act No. 473 (Citizenship)';url='https://www.officialgazette.gov.ph/'}
  )
},
@{
  name='Egypt'; wjpRank='135'; wjpScore='0.35'
  officialReligionShort='Islam (state religion)'; practiceShort='~90% Muslim; ~10% Christian'
  officialReligion='Constitution declares Islam state religion and principles of sharia main source of legislation; freedom of belief for Abrahamic faiths.'
  officialSource='https://www.constituteproject.org/constitution/Egypt_2014'
  practiceReligion='Muslim 90.3%; Christian 9.1%; other 0.6% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Established Islam with sharia source vs Coptic Christian minority.'
  axes=@{life='P';justice='N';sojourner='N';oneLaw='P';child='P';sexual='N';authority='Y';religion='N';truth='N';security='Y'}
  overall='Weak'
  verdict='Penal code punishes murder but blasphemy and apostasy pressures conflict with free exercise. Courts lack impartiality; sojourner and migrant workers face abuse.'
  statutes=@(
    @{axis='Life';note='Intentional killing under Penal Code';cite='Egyptian Penal Code, Art. 230 (Murder)';url='https://www.constituteproject.org/constitution/Egypt_2014'}
    @{axis='Religion';note='Contempt of heavenly religions';cite='Penal Code, Art. 98(f) (Contempt of religion)';url='https://www.constituteproject.org/constitution/Egypt_2014'}
    @{axis='Authority';note='Executive and legislative framework';cite='Constitution of Egypt 2014, Art. 139 (President)';url='https://www.constituteproject.org/constitution/Egypt_2014'}
    @{axis='One law';note='Foreigners residency and deportation';cite='Law No. 89/1960 on Entry and Residence of Foreigners';url='https://www.constituteproject.org/constitution/Egypt_2014'}
    @{axis='Security';note='Anti-terrorism and emergency powers';cite='Anti-Terrorism Law No. 94/2015';url='https://www.constituteproject.org/constitution/Egypt_2014'}
  )
},
@{
  name='Germany'; wjpRank='6'; wjpScore='0.83'
  officialReligionShort='Secular (church-state cooperation)'; practiceShort='~55% Christian; ~37% unaffiliated'
  officialReligion='Basic Law guarantees freedom of faith and conscience; no established church but cooperative church-state relations (Kirchensteuer).'
  officialSource='https://www.gesetze-im-internet.de/gg/BJNR000010949.html'
  practiceReligion='Christian 55.0% (Protestant 24.7%, Catholic 27.2%); unaffiliated 37.5%; Muslim 6.2%; other 1.3% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular Basic Law with church tax system vs growing unaffiliated population.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Strong'
  verdict='StrGB criminalizes murder and perjury with high rule-of-law enforcement. Sojourner integration is orderly but asylum processing has faced strain; no compelled worship.'
  statutes=@(
    @{axis='Life';note='Murder (Mord) punishable by life imprisonment';cite='Strafgesetzbuch (StGB), Sec. 211 (Mord)';url='https://www.gesetze-im-internet.de/stgb/__211.html'}
    @{axis='Justice';note='Bribery of public officials';cite='StGB, Sec. 332 (Bestechlichkeit)';url='https://www.gesetze-im-internet.de/stgb/__332.html'}
    @{axis='Religion';note='Freedom of faith and conscience';cite='Grundgesetz (GG), Art. 4 (Freedom of faith)';url='https://www.gesetze-im-internet.de/gg/art_4.html'}
    @{axis='Sojourner';note='Residence Act for foreigners';cite='Aufenthaltsgesetz (AufenthG)';url='https://www.gesetze-im-internet.de/aufenthg/'}
    @{axis='Truth';note='False testimony under oath';cite='StGB, Sec. 153 (Meineid)';url='https://www.gesetze-im-internet.de/stgb/__153.html'}
    @{axis='One law';note='Nationality Act';cite='Staatsangehorigkeitsgesetz (StAG)';url='https://www.gesetze-im-internet.de/rustag/'}
  )
},
@{
  name='United Kingdom'; wjpRank='14'; wjpScore='0.78'
  officialReligionShort='Established CofE (England)'; practiceShort='~46% Christian; ~37% unaffiliated'
  officialReligion='Church of England established in England; monarch Supreme Governor; Scotland and Wales have no established church; free exercise broadly protected.'
  officialSource='https://www.legislation.gov.uk/ukpga/2023/54/contents/enacted'
  practiceReligion='Christian 46.0%; unaffiliated 37.2%; Muslim 6.5%; Hindu 1.7%; Sikh 0.9%; other 7.7% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Established Anglicanism in England vs minority Christian share and large unaffiliated population.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='P';truth='Y';security='Y'}
  overall='Strong'
  verdict='Murder and perjury strongly prosecuted; courts rank among world best on impartiality. Established church is partial conflict with Ex 20 analog but no compelled idolatry.'
  statutes=@(
    @{axis='Life';note='Murder and manslaughter';cite='Homicide Act 1957';url='https://www.legislation.gov.uk/ukpga/Eliz2/5-6/11/contents'}
    @{axis='Justice';note='Bribery Act 2010';cite='Bribery Act 2010';url='https://www.legislation.gov.uk/ukpga/2010/23/contents'}
    @{axis='Religion';note='Human Rights Act — freedom of thought, conscience, religion';cite='Human Rights Act 1998, Sch. 1 Art. 9';url='https://www.legislation.gov.uk/ukpga/1998/42/schedule/1'}
    @{axis='Sojourner';note='Nationality, Immigration and Asylum Act 2002';cite='Nationality, Immigration and Asylum Act 2002';url='https://www.legislation.gov.uk/ukpga/2002/41/contents'}
    @{axis='Truth';note='Perjury Act 1911';cite='Perjury Act 1911';url='https://www.legislation.gov.uk/ukpga/Geo5/1-2/6/contents'}
    @{axis='One law';note='Immigration Act 1971';cite='Immigration Act 1971';url='https://www.legislation.gov.uk/ukpga/1971/77/contents'}
  )
},
@{
  name='France'; wjpRank='22'; wjpScore='0.72'
  officialReligionShort='Secular (laicite)'; practiceShort='~47% Christian; ~40% unaffiliated'
  officialReligion='1905 Law on Separation of Churches and State; Constitution affirms secular republic; public schools forbid religious symbols (2004 law).'
  officialSource='https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000508749'
  practiceReligion='Christian 47.0%; unaffiliated 40.0%; Muslim 8.0%; Jewish 0.7%; Buddhist 0.5%; other 3.8% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Strict laicite vs substantial Muslim and Christian minorities.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='P';truth='Y';security='Y'}
  overall='Strong'
  verdict='Code penal rigorously punishes homicide and false testimony. Laicite limits public religion expression — partial on Ex 20 analog but no state cult compulsion.'
  statutes=@(
    @{axis='Life';note='Assassinat punishable by life imprisonment';cite='Code penal, Art. 221-1 (Assassinat)';url='https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070719/'}
    @{axis='Religion';note='Law on separation of churches and state';cite='Loi du 9 decembre 1905';url='https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000508749'}
    @{axis='Justice';note='Corruption of public officials';cite='Code penal, Art. 432-11 (Favoritisme)';url='https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070719/'}
    @{axis='Sojourner';note='Code de l entree et du sejour des etrangers';cite='CESEDA (Code de l immigration)';url='https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070719/'}
    @{axis='Truth';note='False testimony (Faux temoignage)';cite='Code penal, Art. 434-13';url='https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070719/'}
  )
},
@{
  name='Italy'; wjpRank='34'; wjpScore='0.66'
  officialReligionShort='Secular (Lateran Treaties)'; practiceShort='~78% Christian (Catholic)'
  officialReligion='Constitution guarantees free exercise; Lateran Pacts recognize Catholic Church relations but no formal state religion since 1984 revisions.'
  officialSource='https://www.gazzettaufficiale.it/atto/serie_generale/caricaDettaglioAtto/originario?atto.dataPubblicazioneGazzetta=1947-12-27&atto.codiceRedazionale=047U0001'
  practiceReligion='Christian 78.0% (Catholic 75.5%); unaffiliated 15.0%; Muslim 3.7%; other 3.3% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution with Catholic concordat vs Catholic-majority practice.'
  axes=@{life='Y';justice='P';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Partial'
  verdict='Codice Penale criminalizes murder and perjury; EU membership supports rule of law. Justice delays and organized crime weaken full impartiality.'
  statutes=@(
    @{axis='Life';note='Omicidio punishable by imprisonment';cite='Codice Penale, Art. 575 (Omicidio)';url='https://www.gazzettaufficiale.it/'}
    @{axis='Religion';note='Free exercise guaranteed';cite='Costituzione, Art. 19 (Liberta di culto)';url='https://www.gazzettaufficiale.it/'}
    @{axis='Justice';note='Corruption in public office';cite='Codice Penale, Art. 318 (Corruzione)';url='https://www.gazzettaufficiale.it/'}
    @{axis='Sojourner';note='Immigration and asylum framework';cite='Decreto Legislativo 286/1998 (Immigrazione)';url='https://www.gazzettaufficiale.it/'}
    @{axis='Truth';note='False testimony (Falsa testimonianza)';cite='Codice Penale, Art. 372';url='https://www.gazzettaufficiale.it/'}
  )
},
@{
  name='South Africa'; wjpRank='60'; wjpScore='0.56'
  officialReligionShort='Secular (religious equality)'; practiceShort='~81% Christian'
  officialReligion='Constitution protects freedom of religion, belief, and opinion; no state religion; equality before law.'
  officialSource='https://www.gov.za/documents/constitution-republic-south-africa-1996-1'
  practiceReligion='Christian 81.2%; unaffiliated 3.2%; Muslim 1.5%; Hindu 1.0%; Jewish 0.1%; folk 8.4%; other 4.6% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular equality vs Christian-majority society and traditional beliefs.'
  axes=@{life='P';justice='P';sojourner='N';oneLaw='P';child='P';sexual='P';authority='Y';religion='Y';truth='P';security='P'}
  overall='Mixed'
  verdict='Constitution enshrines equality and free exercise; Criminal Procedure Act punishes murder. High violent crime and xenophobia against migrants weaken sojourner and life alignment.'
  statutes=@(
    @{axis='Life';note='Murder under common law and Criminal Law Amendment';cite='Criminal Law Amendment Act 105 of 1997';url='https://www.gov.za/documents/'}
    @{axis='Religion';note='Freedom of religion, belief, and opinion';cite='Constitution, Sec. 15 (Freedom of religion)';url='https://www.gov.za/documents/constitution-republic-south-africa-1996-1'}
    @{axis='Justice';note='Prevention and Combating of Corrupt Activities Act';cite='Prevention and Combating of Corrupt Activities Act 12 of 2004';url='https://www.gov.za/documents/'}
    @{axis='One law';note='Immigration Act 13 of 2002';cite='Immigration Act 13 of 2002';url='https://www.gov.za/documents/'}
    @{axis='Truth';note='Perjury Act 18 of 1911';cite='Perjury Act 18 of 1911';url='https://www.gov.za/documents/'}
  )
},
@{
  name='Tanzania'; wjpRank='98'; wjpScore='0.46'
  officialReligionShort='Secular (no state religion)'; practiceShort='~61% Christian; ~35% Muslim'
  officialReligion='Union constitution provides secular state; freedom of worship; Zanzibar has separate religious dynamics.'
  officialSource='https://www.judiciary.go.tz/en/constitution'
  practiceReligion='Christian 61.4%; Muslim 35.2%; folk 1.8%; other 1.6% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular union vs Christian mainland and Muslim Zanzibar/coast.'
  axes=@{life='P';justice='N';sojourner='P';oneLaw='P';child='P';sexual='P';authority='Y';religion='P';truth='N';security='P'}
  overall='Mixed'
  verdict='Penal Code retains murder statutes but political prosecutions and corruption undermine justice. Religious freedom generally upheld with periodic restrictions.'
  statutes=@(
    @{axis='Life';note='Murder under Penal Code Cap 16';cite='Penal Code (Cap 16), Sec. 200 (Murder)';url='https://www.judiciary.go.tz/en/'}
    @{axis='Religion';note='Freedom of worship guaranteed';cite='Constitution of Tanzania, Art. 19 (Freedom of worship)';url='https://www.judiciary.go.tz/en/constitution'}
    @{axis='One law';note='Immigration Act 1995';cite='Immigration Act Cap 54';url='https://www.judiciary.go.tz/en/'}
    @{axis='Authority';note='Union government structure';cite='Constitution of Tanzania, Art. 4 (United Republic)';url='https://www.judiciary.go.tz/en/constitution'}
    @{axis='Security';note='Prevention of Terrorism Act 2002';cite='Prevention of Terrorism Act 2002';url='https://www.judiciary.go.tz/en/'}
  )
},
@{
  name='Kenya'; wjpRank='102'; wjpScore='0.45'
  officialReligionShort='Secular (no state religion)'; practiceShort='~85% Christian; ~11% Muslim'
  officialReligion='2010 Constitution prohibits state religion; guarantees freedom of conscience, religion, and belief.'
  officialSource='https://www.kenyalaw.org/kl/index.php?id=398'
  practiceReligion='Christian 85.5%; Muslim 10.9%; folk 1.6%; other 2.0% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution vs Christian-majority practice.'
  axes=@{life='P';justice='N';sojourner='P';oneLaw='P';child='P';sexual='P';authority='Y';religion='Y';truth='N';security='P'}
  overall='Mixed'
  verdict='Penal Code criminalizes murder; Constitution protects free exercise. Corruption and ethnic politics weaken impartial justice and truth enforcement.'
  statutes=@(
    @{axis='Life';note='Murder under Penal Code';cite='Penal Code (Cap 63), Sec. 203 (Murder)';url='https://www.kenyalaw.org/kl/index.php?id=398'}
    @{axis='Religion';note='Freedom of conscience, religion, and belief';cite='Constitution of Kenya 2010, Art. 32';url='https://www.kenyalaw.org/kl/index.php?id=398'}
    @{axis='Justice';note='Anti-Corruption and Economic Crimes Act';cite='Anti-Corruption and Economic Crimes Act 2003';url='https://www.kenyalaw.org/kl/'}
    @{axis='One law';note='Citizenship and Immigration Act 2011';cite='Citizenship and Immigration Act 2011';url='https://www.kenyalaw.org/kl/'}
    @{axis='Truth';note='Perjury and subornation of perjury';cite='Penal Code, Sec. 108-109 (Perjury)';url='https://www.kenyalaw.org/kl/index.php?id=398'}
  )
},
@{
  name='South Korea'; wjpRank='19'; wjpScore='0.74'
  officialReligionShort='Secular (no state religion)'; practiceShort='~28% Christian; ~46% unaffiliated'
  officialReligion='Constitution guarantees freedom of religion; no state religion; church and state separated.'
  officialSource='https://www.law.go.kr/eng/engMain.do'
  practiceReligion='Unaffiliated 46.0%; Christian 28.0% (Protestant 19.7%, Catholic 7.9%); Buddhist 15.5%; folk 5.3%; other 5.2% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular state vs plurality unaffiliated and active Christian minority.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Strong'
  verdict='Criminal Act rigorously punishes homicide and perjury; courts rank high on impartiality. Immigration is orderly; no compelled national worship.'
  statutes=@(
    @{axis='Life';note='Murder punishable by death, life, or imprisonment';cite='Criminal Act, Art. 250 (Murder)';url='https://www.law.go.kr/eng/engMain.do'}
    @{axis='Justice';note='Bribery of public officials';cite='Criminal Act, Art. 129 (Bribery)';url='https://www.law.go.kr/eng/engMain.do'}
    @{axis='Religion';note='Freedom of religion guaranteed';cite='Constitution of Korea, Art. 20 (Freedom of religion)';url='https://www.law.go.kr/eng/engMain.do'}
    @{axis='One law';note='Immigration Act';cite='Immigration Act of Korea';url='https://www.law.go.kr/eng/engMain.do'}
    @{axis='Truth';note='Perjury and false testimony';cite='Criminal Act, Art. 152 (Perjury)';url='https://www.law.go.kr/eng/engMain.do'}
    @{axis='Security';note='National Security Act';cite='National Security Act';url='https://www.law.go.kr/eng/engMain.do'}
  )
},
@{
  name='Spain'; wjpRank='25'; wjpScore='0.71'
  officialReligionShort='Secular (Catholic not official)'; practiceShort='~68% Christian; ~27% unaffiliated'
  officialReligion='1978 Constitution declares no state religion; guarantees ideological, religious, and worship freedom; cooperation agreements with religious groups.'
  officialSource='https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229'
  practiceReligion='Christian 68.0% (Catholic 58.2%, Protestant 1.3%); unaffiliated 27.0%; Muslim 2.1%; other 2.9% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution vs historically Catholic culture.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Strong'
  verdict='Codigo Penal criminalizes homicide and false testimony with strong rule-of-law institutions. Immigration framework is clear; religious freedom without establishment.'
  statutes=@(
    @{axis='Life';note='Asesinato punishable by imprisonment';cite='Codigo Penal, Art. 138 (Asesinato)';url='https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444'}
    @{axis='Religion';note='Freedom of ideology, religion, and worship';cite='Constitucion Espanola, Art. 16';url='https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229'}
    @{axis='Justice';note='Bribery of public officials';cite='Codigo Penal, Art. 419 (Cohecho)';url='https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444'}
    @{axis='Sojourner';note='Organic Law on rights and freedoms of foreigners';cite='LO 4/2000 sobre derechos y libertades de los extranjeros';url='https://www.boe.es/buscar/act.php?id=BOE-A-2000-5440'}
    @{axis='Truth';note='False testimony (Falso testimonio)';cite='Codigo Penal, Art. 458';url='https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444'}
  )
},
@{
  name='Argentina'; wjpRank='65'; wjpScore='0.54'
  officialReligionShort='Secular (Catholic historically favored)'; practiceShort='~63% Christian (Catholic)'
  officialReligion='Constitution guarantees free exercise; state supports Catholic worship historically but no formal establishment.'
  officialSource='https://www.argentina.gob.ar/normativa/nacional/constitucion-de-la-nacion-argentina-25985'
  practiceReligion='Christian 63.0% (Catholic 54.9%, Protestant 8.1%); unaffiliated 20.0%; other 17.0% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution with Catholic cultural weight vs growing unaffiliated share.'
  axes=@{life='Y';justice='P';sojourner='P';oneLaw='P';child='Y';sexual='P';authority='Y';religion='Y';truth='P';security='Y'}
  overall='Partial'
  verdict='Codigo Penal criminalizes homicide; Constitution protects free exercise. Economic instability and corruption weaken full justice alignment.'
  statutes=@(
    @{axis='Life';note='Homicidio simple and agravado';cite='Codigo Penal, Art. 79 (Homicidio)';url='https://www.argentina.gob.ar/normativa/nacional/ley-1432-1886-6398'}
    @{axis='Religion';note='Free exercise guaranteed';cite='Constitucion Nacional, Art. 14 (Libertad de culto)';url='https://www.argentina.gob.ar/normativa/nacional/constitucion-de-la-nacion-argentina-25985'}
    @{axis='Sojourner';note='Migration law and refugee status';cite='Ley 25.871 de Migraciones';url='https://www.argentina.gob.ar/normativa/nacional/ley-25871-2004-14816'}
    @{axis='Truth';note='Falso testimonio';cite='Codigo Penal, Art. 275 (Falso testimonio)';url='https://www.argentina.gob.ar/normativa/nacional/ley-1432-1886-6398'}
    @{axis='One law';note='Citizenship law';cite='Ley 346 de Ciudadania';url='https://www.argentina.gob.ar/normativa/nacional/'}
  )
},
@{
  name='Canada'; wjpRank='13'; wjpScore='0.79'
  officialReligionShort='Secular (Charter)'; practiceShort='~53% Christian; ~35% unaffiliated'
  officialReligion='Charter guarantees freedom of conscience and religion; no established church; multiculturalism policy.'
  officialSource='https://laws-lois.justice.gc.ca/eng/Const/page-15.html'
  practiceReligion='Christian 53.3%; unaffiliated 34.6%; Muslim 3.2%; Hindu 2.0%; Sikh 1.4%; Buddhist 1.1%; Jewish 1.0%; other 3.4% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular Charter vs Christian plurality and growing unaffiliated population.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Strong'
  verdict='Criminal Code rigorously criminalizes murder and perjury; courts rank among world leaders. Immigration law is orderly; no compelled worship under Charter.'
  statutes=@(
    @{axis='Life';note='Murder and manslaughter';cite='Criminal Code, RSC 1985, c C-46, s 229-236';url='https://laws-lois.justice.gc.ca/eng/acts/C-46/'}
    @{axis='Religion';note='Fundamental freedoms — conscience and religion';cite='Canadian Charter of Rights and Freedoms, s 2(a)';url='https://laws-lois.justice.gc.ca/eng/Const/page-15.html'}
    @{axis='Justice';note='Bribery of judicial officers and corruption';cite='Criminal Code, s 119-122';url='https://laws-lois.justice.gc.ca/eng/acts/C-46/'}
    @{axis='Sojourner';note='Immigration and Refugee Protection Act';cite='Immigration and Refugee Protection Act, SC 2001, c 27';url='https://laws-lois.justice.gc.ca/eng/acts/I-2.5/'}
    @{axis='Truth';note='Perjury';cite='Criminal Code, s 131 (Perjury)';url='https://laws-lois.justice.gc.ca/eng/acts/C-46/'}
    @{axis='One law';note='Citizenship Act';cite='Citizenship Act, RSC 1985, c C-29';url='https://laws-lois.justice.gc.ca/eng/acts/C-29/'}
  )
},
@{
  name='Saudi Arabia'; wjpRank='NR'; wjpScore="$([char]0x2014)"
  officialReligionShort='Islam (Sunni state religion)'; practiceShort='~93% Muslim'
  officialReligion='Basic Law declares Quran and Sunna constitution; Islam official religion; public worship of other faiths prohibited.'
  officialSource='https://www.constituteproject.org/constitution/Saudi_Arabia_1992'
  practiceReligion='Muslim 93.0% (Sunni majority); other 7.0% (mostly expatriate Christian, Hindu, Buddhist workers) (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Established Sunni Islam and sharia governance vs large non-Muslim expatriate workforce.'
  axes=@{life='P';justice='N';sojourner='N';oneLaw='P';child='P';sexual='N';authority='Y';religion='N';truth='N';security='Y'}
  overall='Weak'
  verdict='Sharia criminalizes murder but judicial process lacks impartiality by biblical standards. Compulsory Islamic order and kafala system conflict with sojourner and religion axes.'
  statutes=@(
    @{axis='Life';note='Qisas and diyat for intentional killing under sharia';cite='Law of Criminal Procedure (Royal Decree M/39)';url='https://www.boe.gov.sa/'}
    @{axis='Religion';note='Basic Law — governance by Quran and Sunna';cite='Basic Law of Governance, Art. 1';url='https://www.constituteproject.org/constitution/Saudi_Arabia_1992'}
    @{axis='Authority';note='Monarchy and Council of Ministers';cite='Basic Law of Governance, Art. 5';url='https://www.constituteproject.org/constitution/Saudi_Arabia_1992'}
    @{axis='One law';note='Residency and labor regulations for foreigners';cite='Saudi Labor Law (Royal Decree M/51)';url='https://www.boe.gov.sa/'}
    @{axis='Security';note='Anti-Cyber Crime and counter-terrorism regulations';cite='Anti-Cyber Crime Law (Royal Decree M/17)';url='https://www.boe.gov.sa/'}
  )
},
@{
  name='Australia'; wjpRank='11'; wjpScore='0.80'
  officialReligionShort='Secular (no established church)'; practiceShort='~44% Christian; ~39% unaffiliated'
  officialReligion='Constitution prohibits religious tests for federal office; courts interpret implied freedom of religion; no state religion.'
  officialSource='https://www.legislation.gov.au/Details/C2022C00278'
  practiceReligion='Christian 43.9%; unaffiliated 38.9%; Muslim 3.2%; Buddhist 2.4%; Hindu 2.1%; other 9.5% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution vs near-even Christian and unaffiliated shares.'
  axes=@{life='Y';justice='Y';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='Y';truth='Y';security='Y'}
  overall='Strong'
  verdict='Criminal Code Act criminalizes murder and perjury with high rule-of-law scores. Migration Act provides clear residence rules; no state religion compulsion.'
  statutes=@(
    @{axis='Life';note='Murder under state criminal codes (e.g. NSW)';cite='Crimes Act 1900 (NSW), s 18 (Murder)';url='https://www.legislation.nsw.gov.au/view/html/inforce/current/act-1900-040'}
    @{axis='Religion';note='No religious test for federal office';cite='Constitution, s 116 (Commonwealth not to legislate in respect of religion)';url='https://www.legislation.gov.au/Details/C2022C00278'}
    @{axis='Justice';note='Bribery of Commonwealth public officials';cite='Criminal Code Act 1995 (Cth), s 141.1';url='https://www.legislation.gov.au/Details/C2022C00133'}
    @{axis='Sojourner';note='Migration Act 1958';cite='Migration Act 1958';url='https://www.legislation.gov.au/Details/C2021C00182'}
    @{axis='Truth';note='Perjury provisions in Criminal Code';cite='Criminal Code Act 1995 (Cth), s 137.1';url='https://www.legislation.gov.au/Details/C2022C00133'}
    @{axis='One law';note='Australian Citizenship Act 2007';cite='Australian Citizenship Act 2007';url='https://www.legislation.gov.au/Details/C2021C00407'}
  )
},
@{
  name='Poland'; wjpRank='32'; wjpScore='0.66'
  officialReligionShort='Secular (Catholic concordat)'; practiceShort='~87% Catholic'
  officialReligion='Constitution guarantees freedom of religion; relations with Catholic Church governed by 1997 concordat; no formal state religion.'
  officialSource='https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU19970780483/U/D19970483Lj.pdf'
  practiceReligion='Christian 87.0% (Catholic 86.3%); unaffiliated 5.0%; other 8.0% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Secular constitution with Catholic concordat vs overwhelming Catholic practice.'
  axes=@{life='Y';justice='P';sojourner='P';oneLaw='Y';child='Y';sexual='P';authority='Y';religion='P';truth='Y';security='Y'}
  overall='Partial'
  verdict='Kodeks karny criminalizes murder and perjury; EU membership supports rule of law. Judicial reforms and Catholic public role create partial religion and justice alignment.'
  statutes=@(
    @{axis='Life';note='Murder (Zabojstwo) punishable by imprisonment';cite='Kodeks karny, Art. 148 (Zabojstwo)';url='https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19970880553'}
    @{axis='Religion';note='Freedom of religion and conscience';cite='Konstytucja RP, Art. 53 (Wolnosc sumienia)';url='https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU19970780483/U/D19970483Lj.pdf'}
    @{axis='Justice';note='Corruption of public officials';cite='Kodeks karny, Art. 228 (Przyjmowanie korzysci)';url='https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19970880553'}
    @{axis='One law';note='Act on Foreigners';cite='Ustawa o cudzoziemcach (Dz.U. 2023 poz. 599)';url='https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20230000599'}
    @{axis='Truth';note='False testimony (Zeznanie falszywe)';cite='Kodeks karny, Art. 233';url='https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19970880553'}
  )
},
@{
  name='Turkey'; wjpRank='118'; wjpScore='0.41'
  officialReligionShort='Secular (laicite in constitution)'; practiceShort='~99% Muslim'
  officialReligion='Constitution declares secular republic; Directorate of Religious Affairs (Diyanet) administers Sunni Islam; no official state religion.'
  officialSource='https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=1&MevzuatTur=1&MevzuatTertip=5'
  practiceReligion='Muslim 99.0% (mostly Sunni); other 1.0% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Constitutional secularism vs near-universal Muslim practice and Diyanet role.'
  axes=@{life='Y';justice='N';sojourner='P';oneLaw='P';child='Y';sexual='P';authority='Y';religion='N';truth='N';security='Y'}
  overall='Weak'
  verdict='Turkish Penal Code criminalizes murder but judicial independence eroded. Diyanet and blasphemy prosecutions conflict with free exercise; refugee sojourners face strain.'
  statutes=@(
    @{axis='Life';note='Intentional killing (Kasten oldurme)';cite='Turk Ceza Kanunu, m. 81 (Kasten oldurme)';url='https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=5237&MevzuatTur=1&MevzuatTertip=5'}
    @{axis='Religion';note='Secular republic and freedom of conscience';cite='Anayasa, m. 24 (Din ve vicdan hurriyeti)';url='https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=1&MevzuatTur=1&MevzuatTertip=5'}
    @{axis='One law';note='Foreigners and International Protection Law';cite='6458 sayili Yabancilar ve Uluslararasi Koruma Kanunu';url='https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6458&MevzuatTur=1&MevzuatTertip=5'}
    @{axis='Authority';note='Legislative and executive powers';cite='Anayasa, m. 7 (Yasama gucu)';url='https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=1&MevzuatTur=1&MevzuatTertip=5'}
    @{axis='Security';note='Anti-terror law';cite='3713 sayili Terorle Mucadele Kanunu';url='https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=3713&MevzuatTur=1&MevzuatTertip=5'}
  )
},
@{
  name='Israel'; wjpRank='NR'; wjpScore="$([char]0x2014)"
  officialReligionShort='Jewish state (not secular)'; practiceShort='~73% Jewish; ~18% Muslim'
  officialReligion='Basic Law: Israel as Nation-State of Jewish People (2018); Jewish law inspiration referenced; freedom of religion for all faiths in practice.'
  officialSource='https://www.gov.il/en/departments/legalinfo/basic-laws'
  practiceReligion='Jewish 73.6%; Muslim 18.1%; Christian 1.9%; Druze 1.6%; other 4.8% (Pew 2020 est.)'
  practiceSource='https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
  practiceGap='Jewish nation-state Basic Law vs substantial Muslim and Christian Arab minorities.'
  axes=@{life='Y';justice='P';sojourner='N';oneLaw='P';child='Y';sexual='P';authority='Y';religion='P';truth='Y';security='Y'}
  overall='Mixed'
  verdict='Penal Law criminalizes murder and perjury; courts function with relative impartiality for citizens. Nation-state law and occupation policy create sojourner and religion partiality relative to ger model.'
  statutes=@(
    @{axis='Life';note='Murder under Penal Law';cite='Penal Law, 5737-1977, s 300 (Murder)';url='https://www.gov.il/en/departments/legalinfo/penal-law'}
    @{axis='Religion';note='Basic Law: Human Dignity and Liberty — freedom';cite='Basic Law: Human Dignity and Liberty (1992)';url='https://www.gov.il/en/departments/legalinfo/basic-laws'}
    @{axis='One law';note='Entry into Israel Law and citizenship';cite='Law of Return, 5710-1950';url='https://www.gov.il/en/departments/legalinfo/basic-laws'}
    @{axis='Sojourner';note='Prevention of Infiltration Law';cite='Prevention of Infiltration Law (Offenses and Jurisdiction) 2012';url='https://www.gov.il/en/departments/legalinfo/'}
    @{axis='Truth';note='False testimony and perjury';cite='Penal Law, s 242 (False testimony)';url='https://www.gov.il/en/departments/legalinfo/penal-law'}
    @{axis='Security';note='Defense (Emergency) Regulations';cite='Defense (Emergency) Regulations, 1945';url='https://www.gov.il/en/departments/legalinfo/'}
  )
}
)

$obj = @{ countries = $countries }
$json = $obj | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($Out, $json, (New-Object System.Text.UTF8Encoding $true))
Write-Host "Wrote $($countries.Count) countries to $Out"
