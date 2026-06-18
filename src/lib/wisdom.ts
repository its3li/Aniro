export interface Wisdom {
    type: 'Quran' | 'Hadith';
    arabic: string;
    english: string;
    reference: string;
}

const wisdomData: Wisdom[] = [
    {
        type: 'Quran',
        arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
        english: 'For indeed, with hardship [will be] ease.',
        reference: 'Surah Ash-Sharh, 94:5',
    },
    {
        type: 'Quran',
        arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
        english: 'And whoever relies upon Allah - then He is sufficient for him.',
        reference: 'Surah At-Talaq, 65:3',
    },
    {
        type: 'Quran',
        arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
        english: 'Unquestionably, by the remembrance of Allah hearts are assured.',
        reference: 'Surah Ar-Ra`d, 13:28',
    },
    {
        type: 'Quran',
        arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
        english: 'And when My servants ask you concerning Me - indeed I am near.',
        reference: 'Surah Al-Baqarah, 2:186',
    },
    {
        type: 'Quran',
        arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
        english: 'Allah does not burden a soul beyond that it can bear.',
        reference: 'Surah Al-Baqarah, 2:286',
    },
    {
        type: 'Quran',
        arabic: 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ',
        english: 'And be patient, and your patience is not but through Allah.',
        reference: 'Surah An-Nahl, 16:127',
    },
    {
        type: 'Quran',
        arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
        english: 'Indeed, Allah is with the patient.',
        reference: 'Surah Al-Baqarah, 2:153',
    },
    {
        type: 'Quran',
        arabic: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ',
        english: 'And do not despair of relief from Allah.',
        reference: 'Surah Yusuf, 12:87',
    },
    {
        type: 'Quran',
        arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
        english: 'Indeed, with hardship comes ease.',
        reference: 'Surah Ash-Sharh, 94:6',
    },
    {
        type: 'Quran',
        arabic: 'فَإِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ',
        english: 'Indeed, Allah is the Provider, the possessor of strength.',
        reference: 'Surah Adh-Dhariyat, 51:58',
    },
    {
        type: 'Quran',
        arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
        english: 'And whoever fears Allah - He will make for him a way out.',
        reference: 'Surah At-Talaq, 65:2',
    },
    {
        type: 'Quran',
        arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مِنْ أَمْرِهِ يُسْرًا',
        english: 'And whoever fears Allah - He will make for him of his matter ease.',
        reference: 'Surah At-Talaq, 65:4',
    },
    {
        type: 'Quran',
        arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
        english: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah."',
        reference: 'Surah Az-Zumar, 39:53',
    },
    {
        type: 'Quran',
        arabic: 'إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
        english: 'Indeed, Allah does not waste the reward of those who do good.',
        reference: 'Surah Hud, 11:115',
    },
    {
        type: 'Quran',
        arabic: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
        english: 'And We have certainly made the Quran easy for remembrance, so is there any who will remember?',
        reference: 'Surah Al-Qamar, 54:17',
    },
    {
        type: 'Quran',
        arabic: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
        english: 'Call upon Me; I will respond to you.',
        reference: 'Surah Ghafir, 40:60',
    },
    {
        type: 'Quran',
        arabic: 'وَإِذَا مَسَّ الْإِنسَانَ ضُرٌّ دَعَانَا لِجَنبِهِ أَوْ قَاعِدًا أَوْ قَائِمًا',
        english: 'And when affliction touches man, he calls upon Us.',
        reference: 'Surah Yunus, 10:12',
    },
    {
        type: 'Quran',
        arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
        english: 'So remember Me; I will remember you.',
        reference: 'Surah Al-Baqarah, 2:152',
    },
    {
        type: 'Quran',
        arabic: 'إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ سَيَجْعَلُ لَهُمُ الرَّحْمَٰنُ وُدًّا',
        english: 'Indeed, those who have believed and done righteous deeds - the Most Merciful will appoint for them affection.',
        reference: 'Surah Maryam, 19:96',
    },
    {
        type: 'Quran',
        arabic: 'وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا',
        english: 'And be patient for the decision of your Lord, for you are in Our eyes.',
        reference: 'Surah At-Tur, 52:48',
    },
    {
        type: 'Hadith',
        arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
        english: 'Verily, actions are but by intentions.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'الطُّهُورُ شَطْرُ الإِيمَانِ',
        english: 'Purity is half of faith.',
        reference: 'Sahih Muslim',
    },
    {
        type: 'Hadith',
        arabic: 'مَنْ لَا يَرْحَمُ النَّاسَ لَا يَرْحَمُهُ اللَّهُ',
        english: 'Whoever does not show mercy to people, Allah will not show mercy to him.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
        english: 'The Muslim is the one from whose tongue and hand other Muslims are safe.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
        english: 'None of you truly believes until he loves for his brother what he loves for himself.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ',
        english: 'Allah does not look at your appearance or wealth, but He looks at your hearts and actions.',
        reference: 'Sahih Muslim',
    },
    {
        type: 'Hadith',
        arabic: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ',
        english: 'The strong believer is better and more beloved to Allah than the weak believer.',
        reference: 'Sahih Muslim',
    },
    {
        type: 'Hadith',
        arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
        english: 'Whoever takes a path seeking knowledge, Allah will make easy for him a path to Paradise.',
        reference: 'Sahih Muslim',
    },
    {
        type: 'Hadith',
        arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
        english: 'The best among you are those who learn the Quran and teach it.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'إِذَا قَامَ أَحَدُكُمْ إِلَى الصَّلَاةِ فَإِنَّهُ يُوَاجِهُ الْقِبْلَةَ',
        english: 'When one of you stands for prayer, he faces the Qiblah.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ',
        english: 'Your smile for your brother is charity.',
        reference: 'Jami` at-Tirmidhi',
    },
    {
        type: 'Hadith',
        arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
        english: 'Supplication is worship.',
        reference: 'Jami` at-Tirmidhi',
    },
    {
        type: 'Hadith',
        arabic: 'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ',
        english: 'Indeed, Allah is Beautiful and loves beauty.',
        reference: 'Sahih Muslim',
    },
    {
        type: 'Hadith',
        arabic: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ',
        english: 'Indeed, Allah loves when one of you does a job, to perfect it.',
        reference: 'Al-Bayhaqi',
    },
    {
        type: 'Hadith',
        arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
        english: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'لَا تَغْضَبْ وَلَكَ الْجَنَّةُ',
        english: 'Do not get angry, and Paradise will be yours.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
        english: 'The best of people are those most beneficial to people.',
        reference: 'Al-Mu`jam al-Kabir',
    },
    {
        type: 'Hadith',
        arabic: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ',
        english: 'Indeed, Allah is Gentle and loves gentleness in all matters.',
        reference: 'Sahih al-Bukhari',
    },
    {
        type: 'Hadith',
        arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
        english: 'Charity does not decrease wealth.',
        reference: 'Sahih Muslim',

    },
];

export function getRandomWisdom(): Wisdom {
    const randomIndex = Math.floor(Math.random() * wisdomData.length);
    return wisdomData[randomIndex];
}

export function getDailyWisdom(date: Date = new Date()): Wisdom {
    const dayKey = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const dayNumber = Math.floor(dayKey / 86_400_000);
    return wisdomData[Math.abs(dayNumber) % wisdomData.length];
}
