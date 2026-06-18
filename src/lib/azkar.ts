
export interface AzkarItem {
    arabic: string;
    translation: string;
    repetitions?: number;
    note?: string;
}
  
export interface AzkarCategory {
    id: string;
    name: string;
    nameAr: string;
    icon: string; // Name of the lucide-react icon
    color: string; // Tailwind CSS gradient class
    subCategories?: AzkarCategory[];
    items?: AzkarItem[];
}
  
export const azkarData: AzkarCategory = {
    id: 'root',
    name: 'Categories',
    nameAr: 'الأصناف',
    icon: 'Library',
    color: '',
    subCategories: [
      {
        id: 'morning-azkar',
        name: 'Morning Azkar',
        nameAr: 'أذكار الصباح',
        icon: 'Sun',
        color: 'from-yellow-400 to-orange-500',
        items: [
          {
            arabic: 'أَعُوذُ بِاللهِ مِنْ الشَّيْطَانِ الرَّجِيمِ: اللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
            translation: 'Ayat Al-Kursi: Allah! There is no god but He, the Living, the Self-subsisting. Neither slumber nor sleep overtakes Him. To Him belongs whatsoever is in the heavens and whatsoever is in the earth. Who is he that can intercede with Him except with His Permission? He knows what happens to them in this world, and what will happen to them in the Hereafter. And they will never compass anything of His Knowledge except that which He wills. His Throne extends over the heavens and the earth, and He feels no fatigue in guarding and preserving them. And He is the Most High, the Most Great.',
            repetitions: 1,
          },
          {
            arabic: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم: قُلْ هُوَ ٱللَّهُ أَحَدٌ، ٱللَّهُ ٱلصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
            translation: 'Surah Al-Ikhlas: Say, "He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent."',
            repetitions: 3,
          },
          {
            arabic: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم: قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
            translation: 'Surah Al-Falaq: Say, "I seek refuge in the Lord of daybreak, From the evil of that which He created, And from the evil of darkness when it settles, And from the evil of the blowers in knots, And from the evil of an envier when he envies."',
            repetitions: 3,
          },
          {
            arabic: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم: قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ، مَلِكِ ٱلنَّاسِ، إِلَٰهِ ٱلنَّاسِ، مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ، ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ، مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ',
            translation: 'Surah An-Nas: Say, "I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer, Who whispers [evil] into the breasts of mankind, From among the jinn and mankind."',
            repetitions: 3,
          },
          {
            arabic: 'أَصْـبَحْنا وَأَصْـبَحَ المُـلْكُ لله وَالحَمدُ لله، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُـلكُ ولهُ الحَمْـد، وهُوَ على كلّ شَيءٍ قدير، رَبِّ أسْـأَلُـكَ خَـيرَ ما في هـذا اليوم وَخَـيرَ ما بَعْـدَه، وَأَعـوذُ بِكَ مِنْ شَـرِّ ما في هـذا اليوم وَشَرِّ ما بَعْـدَه، رَبِّ أَعـوذُبِكَ مِنَ الْكَسَـلِ وَسـوءِ الْكِـبَر، رَبِّ أَعـوذُ بِكَ مِنْ عَـذابٍ في النّـارِ وَعَـذابٍ في القَـبْر',
            translation: 'We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner...',
            repetitions: 1,
          },
          {
            arabic: 'اللّهـمَّ أَنْتَ رَبِّـي لا إلهَ إلاّ أَنْتَ، خَلَقْتَنـي وَأَنا عَبْـدُك، وَأَنا عَلـى عَهْـدِكَ وَوَعْـدِكَ ما اسْتَـطَعْـت، أَعـوذُبِكَ مِنْ شَـرِّ ما صَنَـعْت، أَبـوءُ لَـكَ بِنِعْـمَتِـكَ عَلَـيَّ وَأَبـوءُ بِذَنْـبي فَاغْفـِرْ لي فَإِنَّـهُ لا يَغْـفِرُ الذُّنـوبَ إِلاّ أَنْتَ',
            translation: 'Sayyid al-Istighfar: O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant...',
            repetitions: 1,
          },
          {
            arabic: 'رَضيـتُ بِاللهِ رَبَّـاً وَبِالإسْلامِ ديـناً وَبِمُحَـمَّدٍ صلى الله عليه وسلم نَبِيّـاً',
            translation: 'I am pleased with Allah as my Lord, with Islam as my religion and with Muhammad (peace and blessings of Allah be upon him) as my Prophet.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ إِنِّـي أَصْبَـحْتُ أُشْـهِدُك، وَأُشْـهِدُ حَمَلَـةَ عَـرْشِـك، وَمَلَائِكَتَكَ، وَجَمـيعَ خَلْـقِك، أَنَّـكَ أَنْـتَ اللهُ لا إلهَ إلاّ أَنْـتَ وَحْـدَكَ لا شريكَ لَـك، وَأَنَّ ُ مُحَمّـداً عَبْـدُكَ وَرَسـولُـك',
            translation: 'O Allah, I have reached the morning and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You...',
            repetitions: 4,
          },
          {
            arabic: 'اللّهُـمَّ ما أَصْبَـَحَ بي مِـنْ نِعْـمَةٍ أَو بِأَحَـدٍ مِـنْ خَلْـقِك، فَمِـنْكَ وَحْـدَكَ لا شريكَ لَـك، فَلَـكَ الْحَمْـدُ وَلَـكَ الشُّكْـر',
            translation: 'O Allah, what blessing I or any of Your creation have risen upon, is from You alone, without partner...',
            repetitions: 1,
          },
          {
            arabic: 'حَسْبِـيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَـيهِ تَوَكَّـلتُ وَهُوَ رَبُّ العَرْشِ العَظـيم',
            translation: 'Allah is sufficient for me. There is none worthy of worship but Him. I have placed my trust in Him, He is Lord of the Majestic Throne.',
            repetitions: 7,
          },
          {
            arabic: 'بِسـمِ اللهِ الذي لا يَضُـرُّ مَعَ اسمِـهِ شَيءٌ في الأرْضِ وَلا في السّمـاءِ وَهـوَ السّمـيعُ العَلـيم',
            translation: 'In the Name of Allah, who with His Name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ بِكَ أَصْـبَحْنا وَبِكَ أَمْسَـينا، وَبِكَ نَحْـيا وَبِكَ نَمُـوتُ وَإِلَـيْكَ النُّـشُور',
            translation: 'O Allah, by your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.',
            repetitions: 1,
          },
          {
            arabic: 'أَصْبَـحْـنا عَلَى فِطْرَةِ الإسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إبْرَاهِيمَ حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ المُشْرِكِينَ',
            translation: 'We have reached the morning on the natural religion of Islam, on the word of pure faith, on the religion of our Prophet Muhammad...',
            repetitions: 1,
          },
          {
            arabic: 'سُبْحـانَ اللهِ وَبِحَمْـدِهِ عَدَدَ خَلْـقِه، وَرِضا نَفْسِـه، وَزِنَـةَ عَـرْشِـه، وَمِـدادَ كَلِمـاتِـه',
            translation: 'Glory is to Allah and praise is to Him, by the multitude of His creation, by His Pleasure, by the weight of His Throne, and by the extent of His Words.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ عافِـني في بَدَنـي، اللّهُـمَّ عافِـني في سَمْـعي، اللّهُـمَّ عافِـني في بَصَـري، لا إلهَ إلاّ أَنْـتَ',
            translation: 'O Allah, make me healthy in my body. O Allah, preserve for me my hearing. O Allah, preserve for me my sight. There is none worthy of worship but You.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ إِنّـي أَعـوذُ بِكَ مِنَ الْكُـفر، وَالفَـقْر، وَأَعـوذُ بِكَ مِنْ عَذابِ القَـبْر، لا إلهَ إلاّ أَنْـتَ',
            translation: 'O Allah, I seek refuge in You from disbelief and poverty and I seek refuge in You from the punishment of the grave. There is none worthy of worship but You.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ إِنِّـي أسْـأَلُـكَ العَـفْوَ وَالعـافِـيةَ في الدُّنْـيا وَالآخِـرَة، اللّهُـمَّ إِنِّـي أسْـأَلُـكَ العَـفْوَ وَالعـافِـيةَ في ديني وَدُنْـياايَ وَأهْـلي وَمالـي، اللّهُـمَّ اسْتُـرْ عـوْراتي وَآمِـنْ رَوْعاتـي، اللّهُـمَّ احْفَظْـني مِن بَـينِ يَدَيَّ وَمِن خَلْفـي وَعَن يَمـيني وَعَن شِمـالي، وَمِن فَوْقـي، وَأَعـوذُ بِعَظَمَـتِكَ أَن أُغْـتالَ مِن تَحْتـي',
            translation: 'O Allah, I ask You for pardon and well-being in this life and the next. O Allah, I ask You for pardon and well-being in my religious and worldly affairs...',
            repetitions: 1,
          },
          {
            arabic: 'يَا حَيُّ يَا قيُّومُ بِرَحْمَتِكَ أسْتَغِيثُ أصْلِحْ لِي شَأنِي كُلَّهُ وَلاَ تَكِلْنِي إلَى نَفْسِي طَـرْفَةَ عَيْنٍ',
            translation: 'O Ever Living, O Self-Subsisting and Supporter of all, by Your mercy I seek assistance, rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.',
            repetitions: 3,
          },
          {
            arabic: 'أَصْبَـحْـنا وَأَصْبَـحْ المُـلكُ للهِ رَبِّ العـالَمـين، اللّهُـمَّ إِنِّـي أسْـأَلُـكَ خَـيْرَ هـذا الـيَوْم، فَـتْحَهُ، وَنَصْـرَهُ، وَنـورَهُ وَبَـرَكَتَـهُ، وَهُـداهُ، وَأَعـوذُ بِـكَ مِـنْ شَـرِّ ما فـيهِ وَشَـرِّ ما بَعْـدَه',
            translation: 'We have reached the morning and at this very time unto Allah, Lord of the worlds, belongs all sovereignty. O Allah, I ask You for the good of this day...',
            repetitions: 1,
          },
          {
            arabic: 'اللّهُـمَّ عالِـمَ الغَـيْبِ وَالشّـهادَةِ فاطِـرَ السّماواتِ وَالأرْضِ رَبَّ كـلِّ شَـيءٍ وَمَليـكَه، أَشْهَـدُ أَنْ لا إِلـهَ إِلاّ أَنْت، أَعـوذُ بِكَ مِن شَـرِّ نَفْسـي وَمِن شَـرِّ الشَّيْـطانِ وَشِرْكِهِ، وَأَنْ أَقْتَـرِفَ عَلـى نَفْسـي سوءاً أَوْ أَجُـرَّهُ إِلـى مُسْـلِم',
            translation: 'O Allah, Knower of the unseen and the evident, Maker of the heavens and the earth, Lord of everything and its Possessor, I bear witness that there is none worthy of worship but You...',
            repetitions: 1,
          },
          {
            arabic: 'أَعـوذُ بِكَلِمـاتِ اللّهِ التّـامّـاتِ مِنْ شَـرِّ ما خَلَـق',
            translation: 'I seek refuge in the Perfect Words of Allah from the evil of what He has created.',
            repetitions: 3,
          },
          {
            arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ على نَبِيِّنَا مُحمَّد',
            translation: 'O Allah, we ask for your peace and blessings upon our Prophet Muhammad.',
            repetitions: 10,
          },
          {
            arabic: 'اللَّهُمَّ إِنَّا نَعُوذُ بِكَ مِنْ أَنْ نُشْرِكَ بِكَ شَيْئًا نَعْلَمُهُ، وَنَسْتَغْفِرُكَ لِمَا لَا نَعْلَمُهُ',
            translation: 'O Allah, we seek refuge with You from knowingly associating anything with You, and we seek Your forgiveness for that which we do unknowingly.',
            repetitions: 3,
          },
          {
            arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنْ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنْ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ، وَقَهْرِ الرِّجَالِ',
            translation: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
            repetitions: 3,
          },
          {
            arabic: 'أسْتَغْفِرُ اللهَ العَظِيمَ الَّذِي لاَ إلَهَ إلاَّ هُوَ، الحَيُّ القَيُّومُ، وَأتُوبُ إلَيهِ',
            translation: 'I seek the forgiveness of Allah the Mighty, Whom there is none worthy of worship except Him, the Living, the Eternal, and I repent unto Him.',
            repetitions: 3,
          },
          {
            arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
            translation: 'O Allah, I ask You for knowledge that is of benefit, a good provision, and deeds that will be accepted.',
            repetitions: 1,
          },
          {
            arabic: 'لَا إلَه إلّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءِ قَدِيرِ',
            translation: 'None has the right to be worshipped but Allah alone, Who has no partner. His is the dominion and His is the praise, and He is Able to do all things.',
            repetitions: 100,
          },
          {
            arabic: 'سُبْحـانَ اللهِ وَبِحَمْـدِهِ',
            translation: 'Glory is to Allah and praise is to Him.',
            repetitions: 100,
          },
          {
            arabic: 'أسْتَغْفِرُ اللهَ وَأتُوبُ إلَيْهِ',
            translation: 'I seek the forgiveness of Allah and repent to Him.',
            repetitions: 100,
          }
        ],
      },
      {
        id: 'evening-azkar',
        name: 'Evening Azkar',
        nameAr: 'أذكار المساء',
        icon: 'MoonStar',
        color: 'from-orange-500 to-red-600',
        items: [
          {
            arabic: 'أَعُوذُ بِاللهِ مِنْ الشَّيْطَانِ الرَّجِيمِ: اللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
            translation: 'Ayat Al-Kursi: Allah! There is no god but He, the Living, the Self-subsisting. Neither slumber nor sleep overtakes Him. To Him belongs whatsoever is in the heavens and whatsoever is in the earth. Who is he that can intercede with Him except with His Permission? He knows what happens to them in this world, and what will happen to them in the Hereafter. And they will never compass anything of His Knowledge except that which He wills. His Throne extends over the heavens and the earth, and He feels no fatigue in guarding and preserving them. And He is the Most High, the Most Great.',
            repetitions: 1,
          },
          {
            arabic: 'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ. لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَّسِينَآ أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
            translation: 'The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers, [saying], "We make no distinction between any of His messengers." And they say, "We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination."',
            repetitions: 1,
          },
          {
            arabic: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم: قُلْ هُوَ ٱللَّهُ أَحَدٌ، ٱللَّهُ ٱلصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
            translation: 'Surah Al-Ikhlas: Say, "He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent."',
            repetitions: 3,
          },
          {
            arabic: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم: قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
            translation: 'Surah Al-Falaq: Say, "I seek refuge in the Lord of daybreak, From the evil of that which He created, And from the evil of darkness when it settles, And from the evil of the blowers in knots, And from the evil of an envier when he envies."',
            repetitions: 3,
          },
          {
            arabic: 'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم: قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ، مَلِكِ ٱلنَّاسِ، إِلَٰهِ ٱلنَّاسِ، مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ، ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ، مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ',
            translation: 'Surah An-Nas: Say, "I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer, Who whispers [evil] into the breasts of mankind, From among the jinn and mankind."',
            repetitions: 3,
          },
          {
            arabic: 'أَمْسَيْـنا وَأَمْسـى المـلكُ لله وَالحَمدُ لله، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُـلكُ ولهُ الحَمْـد، وهُوَ على كلّ شَيءٍ قدير، رَبِّ أسْـأَلُـكَ خَـيرَ ما في هـذهِ اللَّـيْلَةِ وَخَـيرَ ما بَعْـدَهـا، وَأَعـوذُ بِكَ مِنْ شَـرِّ ما في هـذهِ اللَّـيْلةِ وَشَرِّ ما بَعْـدَهـا، رَبِّ أَعـوذُبِكَ مِنَ الْكَسَـلِ وَسـوءِ الْكِـبَر، رَبِّ أَعـوذُ بِكَ مِنْ عَـذأبٍ في النّـارِ وَعَـذأبٍ في القَـبْر',
            translation: 'We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner...',
            repetitions: 1,
          },
          {
            arabic: 'اللّهـمَّ أَنْتَ رَبِّـي لا إلهَ إلاّ أَنْتَ، خَلَقْتَنـي وَأَنا عَبْـدُك، وَأَنا عَلـى عَهْـدِكَ وَوَعْـدِكَ ما اسْتَـطَعْـت، أَعـوذُبِكَ مِنْ شَـرِّ ما صَنَـعْت، أَبـوءُ لَـكَ بِنِعْـمَتِـكَ عَلَـيَّ وَأَبـوءُ بِذَنْـبي فَاغْفـِرْ لي فَإِنَّـهُ لا يَغْـفِرُ الذُّنـوبَ إِلاّ أَنْتَ',
            translation: 'Sayyid al-Istighfar: O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant...',
            repetitions: 1,
          },
          {
            arabic: 'رَضيـتُ بِاللهِ رَبَّـاً وَبالإسْلامِ ديـناً وَبِمُحَـمَّدٍ صلى الله عليه وسلم نَبِيّـاً',
            translation: 'I am pleased with Allah as my Lord, with Islam as my religion and with Muhammad (peace and blessings of Allah be upon him) as my Prophet.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ إِنِّـي أَمسيتُ أُشْـهِدُك، وَأُشْـهِدُ حَمَلَـةَ عَـرْشِـك، وَمَلَائِكَتَكَ، وَجَمـيعَ خَلْـقِك، أَنَّـكَ أَنْـتَ اللهُ لا إلهَ إلاّ أَنْـتَ وَحْـدَكَ لا شَريكَ لَـك، وَأَنَّ ُ مُحَمّـداً عَبْـدُكَ وَرَسـولُـك',
            translation: 'O Allah, I have reached the evening and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You...',
            repetitions: 4,
          },
          {
            arabic: 'اللّهُـمَّ ما أَمسى بي مِـنْ نِعْـمَةٍ أَو بِأَحَـدٍ مِـنْ خَلْـقِك، فَمِـنْكَ وَحْـدَكَ لا شريكَ لَـك، فَلَـكَ الْحَمْـدُ وَلَـكَ الشُّكْـر',
            translation: 'O Allah, what blessing I or any of Your creation have reached the evening with, is from You alone, without partner...',
            repetitions: 1,
          },
          {
            arabic: 'حَسْبِـيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَـيهِ تَوَكَّـلتُ وَهُوَ رَبُّ العَرْشِ العَظـيم',
            translation: 'Allah is sufficient for me. There is none worthy of worship but Him. I have placed my trust in Him, He is Lord of the Majestic Throne.',
            repetitions: 7,
          },
          {
            arabic: 'بِسـمِ اللهِ الذي لا يَضُـرُّ مَعَ اسمِـهِ شَيءٌ في الأرْضِ وَلا في السّمـاءِ وَهـوَ السّمـيعُ العَلـيم',
            translation: 'In the Name of Allah, who with His Name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ بِكَ أَمْسَـينا وَبِكَ أَصْـبَحْنا، وَبِكَ نَحْـيا وَبِكَ نَمُـوتُ وَإِلَـيْكَ الْمَصِيرُ',
            translation: 'O Allah, by your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.',
            repetitions: 1,
          },
          {
            arabic: 'أَمْسَيْنَا عَلَى فِطْرَةِ الإسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إبْرَاهِيمَ حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ المُشْرِكِينَ',
            translation: 'We have reached the evening on the natural religion of Islam, on the word of pure faith, on the religion of our Prophet Muhammad...',
            repetitions: 1,
          },
          {
            arabic: 'سُبْحـانَ اللهِ وَبِحَمْـدِهِ عَدَدَ خَلْـقِه، وَرِضا نَفْسِـه، وَزِنَـةَ عَـرْشِـه، وَمِـدادَ كَلِمـاتِـه',
            translation: 'Glory is to Allah and praise is to Him, by the multitude of His creation, by His Pleasure, by the weight of His Throne, and by the extent of His Words.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ عافِـني في بَدَنـي، اللّهُـمَّ عافِـني في سَمْـعي، اللّهُـمَّ عافِـني في بَصَـري، لا إلهَ إلاّ أَنْـتَ',
            translation: 'O Allah, make me healthy in my body. O Allah, preserve for me my hearing. O Allah, preserve for me my sight. There is none worthy of worship but You.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ إِنّـي أَعـوذُ بِكَ مِنَ الْكُـفر، وَالفَـقْر، وَأَعـوذُ بِكَ مِنْ عَذابِ القَـبْر، لا إلهَ إلاّ أَنْـتَ',
            translation: 'O Allah, I seek refuge in You from disbelief and poverty and I seek refuge in You from the punishment of the grave. There is none worthy of worship but You.',
            repetitions: 3,
          },
          {
            arabic: 'اللّهُـمَّ إِنِّـي أسْـأَلُـكَ العَـفْوَ وَالعـافِـيةَ في الدُّنْـيا وَالآخِـرَة، اللّهُـمَّ إِنِّـي أسْـأَلُـكَ العَـفْوَ وَالعـافِـيةَ في ديني وَدُنْـياايَ وَأهْـلي وَمالـي، اللّهُـمَّ اسْتُـرْ عـوْراتي وَآمِـنْ رَوْعاتـي، اللّهُـمَّ احْفَظْـني مِن بَـينِ يَدَيَّ وَمِن خَلْفـي وَعَن يَمـيني وَعَن شِمـالي، وَمِن فَوْقـي، وَأَعـوذُ بِعَظَمَـتِكَ أَن أُغْـتالَ مِن تَحْتـي',
            translation: 'O Allah, I ask You for pardon and well-being in this life and the next. O Allah, I ask You for pardon and well-being in my religious and worldly affairs...',
            repetitions: 1,
          },
          {
            arabic: 'يَا حَيُّ يَا قيُّومُ بِرَحْمَتِكَ أسْتَغِيثُ أصْلِحْ لِي شَأنِي كُلَّهُ وَلاَ تَكِلْنِي إلَى نَفْسِي طَـرْفَةَ عَيْنٍ',
            translation: 'O Ever Living, O Self-Subsisting and Supporter of all, by Your mercy I seek assistance, rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.',
            repetitions: 3,
          },
          {
            arabic: 'أَمْسَيْنا وَأَمْسَى الْمُلْكُ للهِ رَبِّ الْعَالَمَيْنِ، اللَّهُمَّ إِنَّي أسْأَلُكَ خَيْرَ هَذَه اللَّيْلَةِ فَتْحَهَا ونَصْرَهَا، ونُوْرَهَا وبَرَكَتهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فيهِا وَشَرَّ مَا بَعْدَهَا',
            translation: 'We have reached the evening and at this very time unto Allah, Lord of the worlds, belongs all sovereignty. O Allah, I ask You for the good of this night...',
            repetitions: 1,
          },
          {
            arabic: 'اللّهُـمَّ عالِـمَ الغَـيْبِ وَالشّـهادَةِ فاطِـرَ السّماواتِ وَالأرْضِ رَبَّ كـلِّ شَـيءٍ وَمَليـكَه، أَشْهَـدُ أَنْ لا إِلـهَ إِلاّ أَنْت، أَعـوذُ بِكَ مِن شَـرِّ نَفْسـي وَمِن شَـرِّ الشَّيْـطانِ وَشِرْكِهِ، وَأَنْ أَقْتَـرِفَ عَلـى نَفْسـي سوءاً أَوْ أَجُـرَّهُ إِلـى مُسْـلِم',
            translation: 'O Allah, Knower of the unseen and the evident, Maker of the heavens and the earth, Lord of everything and its Possessor, I bear witness that there is none worthy of worship but You...',
            repetitions: 1,
          },
          {
            arabic: 'أَعـوذُ بِكَلِمـاتِ اللّهِ التّـامّـاتِ مِنْ شَـرِّ ما خَلَـق',
            translation: 'I seek refuge in the Perfect Words of Allah from the evil of what He has created.',
            repetitions: 3,
          },
          {
            arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ على نَبِيِّنَا مُحمَّد',
            translation: 'O Allah, we ask for your peace and blessings upon our Prophet Muhammad.',
            repetitions: 10,
          },
          {
            arabic: 'اللَّهُمَّ إِنَّا نَعُوذُ بِكَ مِنْ أَنْ نُشْرِكَ بِكَ شَيْئًا نَعْلَمُهُ، وَنَسْتَغْفِرُكَ لِمَا لَا نَعْلَمُهُ',
            translation: 'O Allah, we seek refuge with You from knowingly associating anything with You, and we seek Your forgiveness for that which we do unknowingly.',
            repetitions: 3,
          },
          {
            arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنْ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنْ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ، وَقَهْرِ الرِّجَالِ',
            translation: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
            repetitions: 3,
          },
          {
            arabic: 'أسْتَغْفِرُ اللهَ العَظِيمَ الَّذِي لاَ إلَهَ إلاَّ هُوَ، الحَيُّ القَيُّومُ، وَأتُوبُ إلَيهِ',
            translation: 'I seek the forgiveness of Allah the Mighty, Whom there is none worthy of worship except Him, the Living, the Eternal, and I repent unto Him.',
            repetitions: 3,
          },
          {
            arabic: 'لَا إلَه إلّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءِ قَدِيرِ',
            translation: 'None has the right to be worshipped but Allah alone, Who has no partner. His is the dominion and His is the praise, and He is Able to do all things.',
            repetitions: 100,
          },
          {
            arabic: 'سُبْحـانَ اللهِ وَبِحَمْـدِهِ',
            translation: 'Glory is to Allah and praise is to Him.',
            repetitions: 100,
          }
        ],
      },
      {
        id: 'after-prayer-azkar',
        name: 'After Prayer',
        nameAr: 'بعد الصلاة',
        icon: 'CustomPray',
        color: 'from-sky-400 to-blue-600',
        items: [
          {
            arabic: 'أَسْتَغْفِرُ اللَّهَ (ثَلَاثًا) اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ.',
            translation: 'I seek the forgiveness of Allah (three times). O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honor.',
            repetitions: 1,
          },
          {
            arabic: 'سُبْحَانَ اللَّهِ',
            translation: 'Glory is to Allah.',
            repetitions: 33,
          },
          {
            arabic: 'الْحَمْدُ لِلَّهِ',
            translation: 'Praise is to Allah.',
            repetitions: 33,
          },
          {
            arabic: 'اللَّهُ أَكْبَرُ',
            translation: 'Allah is the Greatest.',
            repetitions: 33,
          },
          {
            arabic: 'لا إلَهَ إلَّا اللهُ، وحدَه لا شَريكَ له، له المُلكُ وله الحَمدُ، وهو على كُلِّ شَيءٍ قديرٌ',
            translation: 'None has the right to be worshipped but Allah alone, Who has no partner. His is the dominion and His is the praise, and He is Able to do all things.',
            repetitions: 1,
            note: '⚠️ بعد صلاة الفجر والمغرب: تُقال 10 مرات',
          },
        ],
      },
      {
        id: 'sleep-dreams',
        name: 'Sleep &amp; Dreams',
        nameAr: 'النوم والأحلام',
        icon: 'BedDouble',
        color: 'from-indigo-500 to-purple-600',
        items: [
            {
                arabic: 'بِاسْمِكَ اللّهُمّ أمُوتُ وَأحْيَا',
                translation: 'In Your name O Allah, I die and I live.',
                repetitions: 1
            },
            {
                arabic: 'يجمع كفيه وينفث فيهما ويقرأ: سورة الإخلاص، وسورة الفلق، وسورة الناس (ثلاث مرات) ويمسح بهما ما استطاع من جسده.',
                translation: 'Cup your hands, blow into them and recite: Surah Al-Ikhlas, Surah Al-Falaq, and Surah An-Nas (3 times), then wipe your hands over whatever you can of your body.',
                repetitions: 1
            },
            {
                arabic: 'بِاسْمِكَ رَبّي وَضَعْتُ جَنْبي، وَبِكَ أرْفَعُهُ، فَإنْ أمْسَكْتَ نَفْسِي فارْحَمْهَا، وَإنْ أرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصّالِحِينَ',
                translation: 'In Your name my Lord, I place my side (upon the bed) and in Your name I raise it. If You take my soul, have mercy on it, and if You release it, protect it with that which You protect Your righteous servants.',
                repetitions: 1
            },
            {
                arabic: 'لا إلهَ إلاّ اللهُ الوَاحِدُ القَهّار، رَبّ السّمَواتِ والأرْضِ وَمَا بَيْنَهُمَا العَزِيزُ الغَفّار',
                translation: 'If you turn over in bed at night: None has the right to be worshipped but Allah, the One, the Subduer, Lord of the heavens and the earth and all that is between them, the All-Mighty, the All-Forgiving.',
                repetitions: 1
            },
            {
                arabic: 'أعُوذُ بِكَلِمَاتِ اللهِ التّامّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَشَرّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشّيَاطِينِ وَأنْ يَحْضُرُون',
                translation: 'For anxiety and fear in sleep: I seek refuge in the perfect words of Allah from His anger and His punishment, from the evil of His slaves, and from the evil suggestions of the devils and from their presence.',
                repetitions: 1
            },
            {
                arabic: '١. ينفث عن يساره (ثلاثاً)\n٢. يستعيذ بالله من الشيطان ومن شر ما رأى (ثلاثاً)\n٣. لا يحدث بها أحداً\n٤. يتحول عن جنبه الذي كان عليه',
                translation: 'What to do upon seeing a bad dream:\n1. Spit dryly to your left (3 times).\n2. Seek refuge in Allah from Satan and from the evil of what you have seen (3 times).\n3. Do not tell anyone about it.\n4. Turn over to the other side you were sleeping on.',
                repetitions: 1
            }
        ]
      },
      {
        id: 'special-prayers',
        name: 'Prophetic Duas',
        nameAr: 'أدعية نبوية',
        icon: 'CustomHeart',
        color: 'from-amber-400 to-yellow-500',
        items: [
          {
            arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى، وَالتُّقَى، وَالْعَفَافَ، وَالْغِنَى',
            translation: 'O Allah, I ask You for guidance, piety, chastity, and wealth.',
            repetitions: 1
          },
          {
            arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
            translation: 'There is no might nor power except with Allah.',
            repetitions: 1,
            note: 'صحيح البخاري 6384: كنز من كنوز الجنة',
          },
          {
            arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
            translation: 'O Allah, send prayers and peace upon our Prophet Muhammad.',
            repetitions: 10,
            note: 'صحيح مسلم 408: من صلى على النبي مرة صلى الله عليه بها عشرا',
          },
          {
            arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
            translation: 'Glory and praise be to Allah; glory be to Allah, the Magnificent.',
            repetitions: 1,
            note: 'متفق عليه: كلمتان خفيفتان على اللسان ثقيلتان في الميزان',
          },
          {
            arabic: 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ، دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ',
            translation: 'O Allah, forgive me all my sins, great and small, the first and the last, those that are apparent and those that are hidden.',
            repetitions: 1
          },
          {
            arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
            translation: 'O Turner of the hearts, keep my heart firm upon Your religion.',
            repetitions: 1
          },
          {
            arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ زَوَالِ نِعْمَتِكَ، وَتَحَوُّلِ عَافِيَتِكَ، وَفُجَاءَةِ نِقْمَتِكَ، وَجَمِيعِ سَخَطِكَ',
            translation: 'O Allah, I seek refuge in You from the withholding of Your favor, the decline of the good health You have given, the suddenness of Your vengeance and from all forms of Your wrath.',
            repetitions: 1
          },
          {
            arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
            translation: 'O Allah, I ask You for well-being in this world and the Hereafter.',
            repetitions: 1
          },
          {
            arabic: 'رَبِّ اغْفِرْ لِي خَطِيئَتِي وَجَهْلِي وَإِسْرَافِي فِي أَمْرِي كُلِّهِ، وَمَا أَنْتَ أَعْلَمُ بِهِ مِنِّي، اللَّهُمَّ اغْفِرْ لِي خَطَايَايَ، وَعَمْدِي وَجَهْلِي وَهَزْلِي، وَكُلُّ ذَلِكَ عِنْدِي',
            translation: 'O my Lord, forgive my sins, my ignorance, my excesses in my affairs, and what You know better than me. O Allah, forgive my sins, what I do intentionally, in ignorance, or in jest, and all that is within me.',
            repetitions: 1
          },
          {
            arabic: 'اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ',
            translation: 'O Allah, Turner of the hearts, direct our hearts to Your obedience.',
            repetitions: 1
          },
          {
            arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ',
            translation: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, from being heavily in debt and from being overpowered by men.',
            repetitions: 1
          },
          {
            arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبُخْلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ، وَأَعُوذُ بِكَ أَنْ أُرَدَّ إِلَى أَرْذَلِ الْعُمُرِ، وَأَعُوذُ بِكَ مِنْ فِتْنَةِ الدُّنْيَا، وَعَذَابِ الْقَبْرِ',
            translation: 'O Allah, I seek refuge with You from miserliness, I seek refuge with You from cowardice, I seek refuge with You from being returned to the feeblest of old age, I seek refuge with You from the trials of this world and from the punishment of the grave.',
            repetitions: 1
          },
          {
            arabic: 'اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ',
            translation: 'O Allah, set right for me my religion which is the safeguard of my affairs. And set right for me my world in which is my life. And set right for me my Hereafter to which is my return. And make the life for me an increase in all good, and make the death for me a rest from all evil.',
            repetitions: 1
          }
        ]
      },
      {
        id: 'hardship-relief',
        name: 'Hardship &amp; Relief',
        nameAr: 'الهم والكرب',
        icon: 'CustomSad',
        color: 'from-rose-400 to-red-500',
        items: [
            {
                arabic: 'اللّهُمّ إنّي عَبْدُكَ ابْنُ عَبْدِكَ ابْنُ أمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيّ حُكْمُكَ، عَدْلٌ فِيّ قَضَاؤُكَ...',
                translation: 'For worry and grief: O Allah, I am Your servant, son of Your servant, son of Your female servant. My forelock is in Your hand. Your command over me is forever executed and Your decree over me is just...',
                repetitions: 1
            },
            {
                arabic: 'اللّهُمّ إنّي أعُوذُ بِكَ مِنَ الهَمّ وَالحَزَنِ، وَالعَجْزِ وَالكَسَلِ، وَالبُخْلِ وَالجُبْنِ، وَضَلَعِ الدّيْنِ وَغَلَبَةِ الرّجَالِ',
                translation: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, from being heavily in debt and from being overpowered by men.',
                repetitions: 1
            },
            {
                arabic: 'لا إلهَ إلاّ اللهُ العَظِيمُ الحَلِيم، لا إلهَ إلاّ اللهُ رَبّ العَرْشِ العَظِيم، لا إلهَ إلاّ اللهُ رَبّ السّمَواتِ وَرَبّ الأرْضِ وَرَبّ العَرْشِ الكَرِيم',
                translation: 'For distress: There is no god but Allah, the All-Mighty, the Forbearing. There is no god but Allah, Lord of the magnificent throne. There is no god but Allah, Lord of the heavens and Lord of the earth, and Lord of the noble throne.',
                repetitions: 1
            },
            {
                arabic: 'اللّهُمّ اكْفِنِي بِحَلالِكَ عَنْ حَرَامِكَ، وَأغْنِنِي بِفَضْلِكَ عَمّنْ سِوَاكَ',
                translation: 'For paying off a debt: O Allah, suffice me with what You have permitted against what You have forbidden, and make me independent of all others besides You.',
                repetitions: 1
            },
            {
                arabic: 'اللّهُمّ لا سَهْلَ إلاّ مَا جَعَلْتَهُ سَهْلاً، وَأنْتَ تَجْعَلُ الحَزْنَ إذَا شِئْتَ سَهْلاً',
                translation: 'For a difficult matter: O Allah, there is no ease except in that which You have made easy, and You make the difficulty, if You wish, easy.',
                repetitions: 1
            },
            {
                arabic: 'اللّهُمّ إنّا نَجْعَلُكَ في نُحُورِهِم، وَنَعُوذُ بِكَ مِنْ شُرُورِهِم',
                translation: 'When meeting an enemy: O Allah, we place You before them and we seek refuge in You from their evil.',
                repetitions: 1
            },
            {
                arabic: 'أعُوذُ بِاللهِ مِنَ الشّيْطَانِ الرّجِيم',
                translation: 'For waswasa (whisperings): I seek refuge in Allah from the accursed Satan.',
                repetitions: 1
            },
            {
                arabic: 'قَدّرَ اللهُ وَمَا شَاءَ فَعَل',
                translation: 'When something undesirable happens: Allah has decreed and what He wills, He does.',
                repetitions: 1
            }
        ]
      },
      {
        id: 'daily-duas',
        name: 'Daily Duas',
        nameAr: 'أدعية يومية',
        icon: 'SunMoon',
        color: 'from-blue-900 to-amber-500',
        subCategories: [
          {
            id: 'wakeup-azkar',
            name: 'When waking up',
            nameAr: 'عند الاستيقاظ',
            icon: 'Sun',
            color: 'from-yellow-400 to-orange-500',
            items: [{
              arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
              translation: 'All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.',
              repetitions: 1,
            }]
          },
          {
            id: 'mosque-azkar',
            name: 'For the Mosque',
            nameAr: 'للمسجد',
            icon: 'Home',
            color: 'from-teal-400 to-cyan-600',
            items: [{
              arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
              translation: 'O Allah, open the gates of Your mercy for me.',
              repetitions: 1,
              note: 'عند الدخول للمسجد',
            }, {
              arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
              translation: 'O Allah, I ask You from Your bounty.',
              repetitions: 1,
              note: 'عند الخروج من المسجد',
            }]
          },
          {
            id: 'food-drink-azkar',
            name: 'Food & Drink',
            nameAr: 'أذكار الطعام والشراب',
            icon: 'Utensils',
            color: '',
            items: [
              {
                arabic: 'بِسْمِ اللَّهِ',
                translation: 'In the name of Allah.',
                repetitions: 1,
                note: 'Before eating or drinking.',
              },
              {
                arabic: 'بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ',
                translation: 'In the name of Allah at its beginning and its end.',
                repetitions: 1,
                note: 'If you forgot to say Bismillah at the beginning.',
              },
              {
                arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا، وَرَزَقَنِيهِ، مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
                translation: 'All praise is for Allah who fed me this and provided it for me without any might or power from myself.',
                repetitions: 1,
                note: 'After eating.',
              },
            ],
          },
          {
            id: 'home-azkar',
            name: 'Entering & Leaving Home',
            nameAr: 'دخول وخروج المنزل',
            icon: 'DoorOpen',
            color: '',
            items: [
              {
                arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
                translation: 'In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we place our trust.',
                repetitions: 1,
                note: 'When entering home.',
              },
              {
                arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
                translation: 'In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.',
                repetitions: 1,
                note: 'When leaving home.',
              },
            ],
          },
          {
            id: 'travel-azkar',
            name: 'Travel',
            nameAr: 'أذكار السفر',
            icon: 'Car',
            color: '',
            items: [
              {
                arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
                translation: 'Glory is to Him who has subjected this to us, and we could never have it by our efforts. Surely to our Lord we are returning.',
                repetitions: 1,
                note: 'When mounting or starting a journey.',
              },
              {
                arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى',
                translation: 'O Allah, we ask You in this journey for righteousness, piety, and deeds that please You.',
                repetitions: 1,
              },
              {
                arabic: 'آيِبُونَ، تَائِبُونَ، عَابِدُونَ، لِرَبِّنَا حَامِدُونَ',
                translation: 'We return, repent, worship, and praise our Lord.',
                repetitions: 1,
                note: 'When returning from travel.',
              },
            ],
          },
          {
            id: 'clothing-azkar',
            name: 'Clothing',
            nameAr: 'أذكار اللباس',
            icon: 'Shirt',
            color: '',
            items: [
              {
                arabic: 'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا الثَّوْبَ، وَرَزَقَنِيهِ، مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
                translation: 'All praise is for Allah who clothed me with this garment and provided it for me without any might or power from myself.',
                repetitions: 1,
              },
              {
                arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ، أَنْتَ كَسَوْتَنِيهِ، أَسْأَلُكَ خَيْرَهُ وَخَيْرَ مَا صُنِعَ لَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّهِ وَشَرِّ مَا صُنِعَ لَهُ',
                translation: 'O Allah, praise is Yours. You clothed me with it. I ask You for its good and the good for which it was made, and I seek refuge in You from its evil and the evil for which it was made.',
                repetitions: 1,
                note: 'When wearing a new garment.',
              },
            ],
          }
        ]
      },
      {
        id: 'quranic-duas',
        name: 'Quranic Duas',
        nameAr: 'أدعية قرآنية',
        icon: 'BookOpenText',
        color: 'from-purple-500 to-violet-600',
        items: [
          {
            arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ',
            translation: 'Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.',
            repetitions: 1,
          },
          {
            arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صْبْرًا وَثﺒِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
            translation: 'Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.',
            repetitions: 1,
          },
          {
            arabic: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
            translation: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.',
            repetitions: 1,
          },
          {
            arabic: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثﺒِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
            translation: 'Our Lord, forgive us our sins and the excess [committed] in our affairs and plant firmly our feet and give us victory over the disbelieving people.',
            repetitions: 1,
          },
          {
            arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
            translation: 'Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.',
            repetitions: 1,
          },
          {
            arabic: 'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
            translation: 'Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.',
            repetitions: 1,
          },
          {
            arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
            translation: 'Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.',
            repetitions: 1,
          },
          {
            arabic: 'رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً ۖ إِنَّكَ سَمِيعُ الدُّعَاءِ',
            translation: 'My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.',
            repetitions: 1,
          },
          {
            arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
            translation: 'My Lord, have mercy upon them as they brought me up [when I was] small.',
            repetitions: 1,
          },
          {
            arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
            translation: 'And say, \'My Lord, increase me in knowledge.\'',
            repetitions: 1,
          },
          {
            arabic: 'رَبِّ هَبْ لِي حُكْمًا وَأَلْحِقْنِي بِالصَّالِحِينَ',
            translation: 'My Lord, grant me authority and join me with the righteous.',
            repetitions: 1,
          }
        ]
      }
    ],
};

    
