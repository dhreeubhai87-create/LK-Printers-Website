// Indian States, Districts, and Cities data structure for registration dropdowns

export interface State {
  id: string;
  name: string;
}

export const INDIAN_STATES: State[] = [
  { id: "AP", name: "Andhra Pradesh" },
  { id: "AR", name: "Arunachal Pradesh" },
  { id: "AS", name: "Assam" },
  { id: "BR", name: "Bihar" },
  { id: "CG", name: "Chhattisgarh" },
  { id: "GA", name: "Goa" },
  { id: "GJ", name: "Gujarat" },
  { id: "HR", name: "Haryana" },
  { id: "HP", name: "Himachal Pradesh" },
  { id: "JH", name: "Jharkhand" },
  { id: "KA", name: "Karnataka" },
  { id: "KL", name: "Kerala" },
  { id: "MP", name: "Madhya Pradesh" },
  { id: "MH", name: "Maharashtra" },
  { id: "MN", name: "Manipur" },
  { id: "ML", name: "Meghalaya" },
  { id: "MZ", name: "Mizoram" },
  { id: "NL", name: "Nagaland" },
  { id: "OD", name: "Odisha" },
  { id: "PB", name: "Punjab" },
  { id: "RJ", name: "Rajasthan" },
  { id: "SK", name: "Sikkim" },
  { id: "TN", name: "Tamil Nadu" },
  { id: "TG", name: "Telangana" },
  { id: "TR", name: "Tripura" },
  { id: "UP", name: "Uttar Pradesh" },
  { id: "UT", name: "Uttarakhand" },
  { id: "WB", name: "West Bengal" },
  { id: "AN", name: "Andaman and Nicobar Islands" },
  { id: "CH", name: "Chandigarh" },
  { id: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { id: "DL", name: "Delhi" },
  { id: "JK", name: "Jammu and Kashmir" },
  { id: "LA", name: "Ladakh" },
  { id: "LD", name: "Lakshadweep" },
  { id: "PY", name: "Puducherry" }
].sort((a, b) => a.name.localeCompare(b.name));

export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", 
    "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari"
  ],
  "Arunachal Pradesh": [
    "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Itanagar Capital Complex", 
    "Kurung Kumey", "Lohit", "Lower Subansiri", "Papum Pare", "Tawang", "Tirap", "West Kameng"
  ],
  "Assam": [
    "Barpeta", "Cachar", "Darrang", "Dibrugarh", "Jorhat", "Kamrup Metropolitan", 
    "Kamrup Rural", "Karbi Anglong", "Lakhimpur", "Nagaon", "Sivasagar", "Sonitpur", "Tinsukia"
  ],
  "Bihar": [
    "Araria", "Aurangabad", "Banki", "Begusarai", "Bhagalpur", "Bhojpur", "Darbhanga", 
    "Gaya", "Gopalganj", "Katihar", "Madhubani", "Muzaffarpur", "Nalanda", "Patna", "Purnia", "Rohtas", "Samastipur", "Siwan", "Vaishali"
  ],
  "Chhattisgarh": [
    "Bastari", "Bilaspur", "Durg", "Janigir-Champa", "Korba", "Raigarh", "Raipur", "Rajnandgaon", "Surguja"
  ],
  "Delhi": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", 
    "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  "Goa": [
    "North Goa", "South Goa"
  ],
  "Gujarat": [
    "Ahmedabad", "Amreli", "Anand", "Banaskantha", "Bharuch", "Bhavnagar", "Dahod", "Gandhinagar", 
    "Jamnagar", "Junagadh", "Kutch", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", 
    "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Vadodara", "Valsad"
  ],
  "Haryana": [
    "Ambala", "Bhiwani", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", 
    "Karnal", "Kurukshetra", "Mahendragarh", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"
  ],
  "Himachal Pradesh": [
    "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"
  ],
  "Jammu and Kashmir": [
    "Anantnag", "Baramulla", "Budgam", "Doda", "Jammu", "Kathua", "Kupwara", "Poonch", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
  ],
  "Jharkhand": [
    "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", 
    "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "West Singhbhum"
  ],
  "Karnataka": [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", 
    "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", 
    "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", 
    "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"
  ],
  "Kerala": [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", 
    "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Chhindwara", "Dewas", "Dhar", "Gwalior", "Indore", "Jabalpur", "Khandwa", "Khargone", 
    "Mandsaur", "Morena", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Shivpuri", "Ujjain", "Vidisha"
  ],
  "Maharashtra": [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", 
    "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", 
    "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", 
    "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
  ],
  "Manipur": [
    "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Senapati", "Thoubal", "Ukhrul"
  ],
  "Meghalaya": [
    "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Ri Bhoi", "South Garo Hills", "West Garo Hills", "West Khasi Hills"
  ],
  "Mizoram": [
    "Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"
  ],
  "Nagaland": [
    "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"
  ],
  "Odisha": [
    "Angul", "Balasore", "Bargarh", "Bhadrak", "Bolangir", "Cuttack", "Deogarh", "Dhenkanal", "Ganjam", 
    "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kendrapara", "Keonjhar", "Khordha", "Koraput", 
    "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
  ],
  "Punjab": [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", 
    "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", 
    "Rupnagar", "Sahibzada Ajit Singh Nagar (Mohali)", "Sangrur", "Tarn Taran"
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", 
    "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", 
    "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", 
    "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
  ],
  "Sikkim": [
    "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"
  ],
  "Tamil Nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", 
    "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", 
    "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", 
    "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", 
    "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
  ],
  "Telangana": [
    "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", 
    "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", 
    "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", 
    "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", 
    "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"
  ],
  "Tripura": [
    "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", 
    "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Bara Banki", "Bareilly", "Basti", "Bijnor", 
    "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", 
    "Firozabad", "Gautam Buddha Nagar (Noida)", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", 
    "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", 
    "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", 
    "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", 
    "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shrawasti", 
    "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
  ],
  "Uttarakhand": [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", 
    "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
  ],
  "West Bengal": [
    "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", 
    "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", 
    "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", 
    "Purulia", "South 24 Parganas", "Uttar Dinajpur"
  ],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

export const CITIES_BY_DISTRICT: Record<string, string[]> = {
  // Key districts from various states
  // Karnataka
  "Bengaluru Urban": ["Bengaluru", "Kengeri", "Yelahanka", "Whitefield", "Electronic City"],
  "Mysuru": ["Mysuru", "Nanjangud", "Hunsur", "T Narasipura", "K R Nagar"],
  "Dharwad": ["Hubballi", "Dharwad", "Kalghatgi", "Kundgol", "Navalgund"],
  "Dakshina Kannada": ["Mangaluru", "Ullal", "Bantwal", "Puttur", "Belthangady"],
  "Belagavi": ["Belagavi", "Gokak", "Chikodi", "Athani", "Nipani", "Bailhongal"],
  
  // Maharashtra
  "Mumbai City": ["Mumbai", "Colaba", "Dadar", "Fort", "Byculla"],
  "Mumbai Suburban": ["Andheri", "Bandra", "Borivali", "Kurla", "Ghatkopar", "Mulund"],
  "Pune": ["Pune", "Pimpri-Chinchwad", "Chakan", "Lonavala", "Baramati", "Talegaon"],
  "Thane": ["Thane", "Kalyan", "Dombivli", "Mira-Bhayandar", "Ulhasnagar", "Ambernath", "Bhiwandi"],
  "Nagpur": ["Nagpur", "Kamthi", "Umred", "Kalmeshwar"],
  "Nashik": ["Nashik", "Malegaon", "Manmad", "Sinnar", "Ozar", "Igatpuri"],

  // Delhi
  "New Delhi": ["Connaught Place", "Chanakyapuri", "Vasant Kunj", "Saket", "Dwarka"],
  "Central Delhi": ["Daryaganj", "Paharganj", "Karol Bagh", "Chandni Chowk"],
  "South Delhi": ["Hauz Khas", "Greater Kailash", "Nehru Place", "Lajpat Nagar"],

  // Tamil Nadu
  "Chennai": ["Chennai", "Adyar", "Mylapore", "T Nagar", "Velachery", "Tambaram", "Anna Nagar"],
  "Coimbatore": ["Coimbatore", "Pollachi", "Mettupalayam", "Valparai"],
  "Madurai": ["Madurai", "Melur", "Thirumangalam", "Vadipatti"],

  // Telangana
  "Hyderabad": ["Hyderabad", "Secunderabad", "Gachibowli", "Madhapur", "Kukatpally", "Begumpet"],
  "Warangal Urban": ["Warangal", "Hanamkonda", "Kazipet"],

  // Uttar Pradesh
  "Lucknow": ["Lucknow", "Malihabad", "Bakshi Ka Talab", "Gosainganj"],
  "Kanpur Nagar": ["Kanpur", "Bilhau", "Ghatampur"],
  "Gautam Buddha Nagar (Noida)": ["Noida", "Greater Noida", "Dadri", "Jewar"],
  "Ghaziabad": ["Ghaziabad", "Loni", "Modinagar", "Muradnagar"],
  "Varanasi": ["Varanasi", "Ramnagar", "Pindra"],

  // West Bengal
  "Kolkata": ["Kolkata", "Salt Lake", "New Town", "Alipore", "Ballygunge"],
  "Howrah": ["Howrah", "Bally", "Uluberia", "Andul"],
  "Darjeeling": ["Darjeeling", "Kurseong", "Mirik"],

  // Gujarat
  "Ahmedabad": ["Ahmedabad", "Bavla", "Sanand", "Viramgam", "Dholka"],
  "Surat": ["Surat", "Bardoli", "Vyara", "Kosamba"],
  "Vadodara": ["Vadodara", "Padra", "Karjan", "Dabhoi"],

  // Rajasthan
  "Jaipur": ["Jaipur", "Sanganer", "Amer", "Chomu", "Bagru"],
  "Jodhpur": ["Jodhpur", "Piparcity", "Bilara"],

  // Bihar
  "Patna": ["Patna", "Danapur", "Khagaul", "Phulwari Sharif", "Fatwah"],

  // Kerala
  "Ernakulam": ["Kochi", "Aluva", "Angamaly", "Perumbavoor", "Muvattupuzha", "Tripunithura"],
  "Thiruvananthapuram": ["Thiruvananthapuram", "Neyyattinkara", "Attingal", "Nedumangad"]
};

// A fallback function to get list of cities for districts not fully mapped in CITIES_BY_DISTRICT
export function getCitiesForDistrict(district: string): string[] {
  if (CITIES_BY_DISTRICT[district]) {
    return CITIES_BY_DISTRICT[district];
  }
  // Return a generated fallback list of cities/towns based on the district name to ensure the City select works beautifully
  return [
    `${district} City`,
    `${district} Town`,
    `${district} Rural`,
    `East ${district}`,
    `West ${district}`
  ];
}
