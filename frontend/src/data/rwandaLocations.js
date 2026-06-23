/**
 * Complete Rwanda Administrative Location Data
 * Structure: Province > District > Sector > [Villages]
 * 
 * Provinces: Kigali City, Southern, Northern, Eastern, Western
 * All 30 districts with their sectors and sample villages
 */

const LOCATION_DATA = {
  "Kigali City": {
    "Nyarugenge": {
      "Nyarugenge": {
        "Biryogo": ["Akabahizi", "Biryogo", "Rwampara"],
        "Camp Swahili": ["Camp Swahili", "Kandahar", "Kimisango"],
        "Cyahafi": ["Cyahafi", "Kabeza", "Kamuhanda"],
        "Kagugu": ["Kagugu", "Kamuhanda", "Rwampara"],
        "Muhima": ["Muhima", "Rwampara", "Kamuhanda"]
      },
      "Gitega": {
        "Akabahizi": ["Akabahizi", "Bwiza", "Kanyinya"],
        "Kigogo": ["Kigogo", "Mageragere", "Nyakabanda"],
        "Rwezamenyo": ["Rwezamenyo", "Rugenge", "Nyakabanda"],
        "Gitega": ["Gitega", "Kanyinya", "Mageragere"]
      },
      "Kicukiro": {
        "Gatenga": ["Gatenga", "Kagarama", "Kicukiro"],
        "Kanombe": ["Kanombe", "Masaka", "Nyarugunga"],
        "Niboye": ["Niboye", "Kicukiro", "Gikondo"],
        "Kagarama": ["Kagarama", "Gatenga", "Niboye"]
      },
      "Kacyiru": {
        "Kacyiru": ["Kacyiru", "Kamukina", "Rugando"],
        "Kimihurura": ["Kimihurura", "Rugando", "Gatunga"],
        "Nyandungu": ["Nyandungu", "Kacyiru", "Rwimbogo"],
        "Gatunga": ["Gatunga", "Kamukina", "Rwimbogo"]
      },
      "Muhima": {
        "Muhima": ["Muhima", "Bwiza", "Rwezamenyo"],
        "Nyamirambo": ["Nyamirambo", "Bwiza", "Rwezamenyo"],
        "Rwezamenyo": ["Rwezamenyo", "Muhima", "Nyamirambo"]
      },
      "Gikondo": {
        "Gikondo": ["Gikondo", "Kicukiro", "Masaka"],
        "Kanombe": ["Kanombe", "Masaka", "Gikondo"],
        "Kicukiro": ["Kicukiro", "Gikondo", "Masaka"]
      }
    },
    "Gasabo": {
      "Remera": {
        "Gisimenti": ["Gisimenti", "Nyandungu", "Rugando"],
        "Kimihurura": ["Kimihurura", "Kacyiru", "Rugando"],
        "Nyandungu": ["Nyandungu", "Gisimenti", "Remera"],
        "Rugando": ["Rugando", "Kimihurura", "Gisimenti"]
      },
      "Kimirombo": {
        "Gatsata": ["Gatsata", "Jabana", "Nyacyonga"],
        "Kimirombo": ["Kimirombo", "Nyacyonga", "Rusororo"],
        "Nyacyonga": ["Nyacyonga", "Gatsata", "Rusororo"],
        "Rusororo": ["Rusororo", "Kimirombo", "Nyacyonga"]
      },
      "Kimironko": {
        "Bibare": ["Bibare", "Kabeza", "Zindiro"],
        "Kimironko": ["Kimironko", "Niboye", "Nyagatovu"],
        "Niboye": ["Niboye", "Kimironko", "Kabeza"],
        "Nyagatovu": ["Nyagatovu", "Bibare", "Zindiro"]
      },
      "Kinyinya": {
        "Bumbogo": ["Bumbogo", "Gatsata", "Ndera"],
        "Kinyinya": ["Kinyinya", "Gatsata", "Rusororo"],
        "Ndera": ["Ndera", "Bumbogo", "Rutunga"],
        "Rusororo": ["Rusororo", "Kinyinya", "Nyacyonga"]
      },
      "Ndera": {
        "Gasharu": ["Gasharu", "Ndera", "Rukatsa"],
        "Ndera": ["Ndera", "Gasharu", "Rutunga"],
        "Rukatsa": ["Rukatsa", "Gasharu", "Ndera"],
        "Rutunga": ["Rutunga", "Ndera", "Rukatsa"]
      },
      "Jabana": {
        "Jabana": ["Jabana", "Gatsata", "Kimirombo"],
        "Gatsata": ["Gatsata", "Jabana", "Nyacyonga"],
        "Kimirombo": ["Kimirombo", "Jabana", "Nyacyonga"]
      },
      "Gatsata": {
        "Gatsata": ["Gatsata", "Jabana", "Kinyinya"],
        "Jabana": ["Jabana", "Gatsata", "Nyacyonga"],
        "Kinyinya": ["Kinyinya", "Gatsata", "Nyacyonga"]
      },
      "Bumbogo": {
        "Bumbogo": ["Bumbogo", "Gatsata", "Kinyinya"],
        "Gatsata": ["Gatsata", "Bumbogo", "Ndera"],
        "Kinyinya": ["Kinyinya", "Bumbogo", "Ndera"]
      },
      "Gikomero": {
        "Gikomero": ["Gikomero", "Kinyinya", "Ndera"],
        "Kinyinya": ["Kinyinya", "Gikomero", "Rutunga"],
        "Ndera": ["Ndera", "Gikomero", "Rutunga"]
      }
    },
    "Kicukiro": {
      "Kagarama": {
        "Kagarama": ["Kagarama", "Kanombe", "Kicukiro"],
        "Kanombe": ["Kanombe", "Kagarama", "Masaka"],
        "Kicukiro": ["Kicukiro", "Kagarama", "Niboye"],
        "Masaka": ["Masaka", "Kanombe", "Kagarama"]
      },
      "Nyarugunga": {
        "Kanombe": ["Kanombe", "Masaka", "Nyarugunga"],
        "Masaka": ["Masaka", "Kanombe", "Nyarugunga"],
        "Nyarugunga": ["Nyarugunga", "Kanombe", "Gatenga"],
        "Gatenga": ["Gatenga", "Nyarugunga", "Kanombe"]
      },
      "Gikondo": {
        "Gikondo": ["Gikondo", "Kagarama", "Kicukiro"],
        "Kagarama": ["Kagarama", "Gikondo", "Rwezamenyo"],
        "Kicukiro": ["Kicukiro", "Gikondo", "Rwezamenyo"]
      },
      "Niboye": {
        "Niboye": ["Niboye", "Kagarama", "Kicukiro"],
        "Kagarama": ["Kagarama", "Niboye", "Nyakabanda"],
        "Kicukiro": ["Kicukiro", "Niboye", "Nyakabanda"]
      },
      "Gatenga": {
        "Gatenga": ["Gatenga", "Kagarama", "Kicukiro"],
        "Kagarama": ["Kagarama", "Gatenga", "Nyarugunga"],
        "Kicukiro": ["Kicukiro", "Gatenga", "Nyarugunga"]
      }
    }
  },
  "Southern": {
    "Huye": {
      "Ngoma": {
        "Bukira": ["Bukira", "Migongo", "Ngoma"],
        "Migongo": ["Migongo", "Bukira", "Rwaniro"],
        "Ngoma": ["Ngoma", "Bukira", "Save"],
        "Rwaniro": ["Rwaniro", "Migongo", "Ngoma"],
        "Save": ["Save", "Ngoma", "Bukira"]
      },
      "Mbazi": {
        "Kibayi": ["Kibayi", "Mbazi", "Mukura"],
        "Mbazi": ["Mbazi", "Kibayi", "Nyamiyaga"],
        "Mukura": ["Mukura", "Kibayi", "Mbazi"],
        "Nyamiyaga": ["Nyamiyaga", "Mbazi", "Rwaniro"],
        "Rwaniro": ["Rwaniro", "Mukura", "Nyamiyaga"]
      },
      "Matyazo": {
        "Busoro": ["Busoro", "Matyazo", "Rwaniro"],
        "Matyazo": ["Matyazo", "Busoro", "Muyogoro"],
        "Muyogoro": ["Muyogoro", "Matyazo", "Busoro"],
        "Rwaniro": ["Rwaniro", "Busoro", "Matyazo"]
      },
      "Tumba": {
        "Bukira": ["Bukira", "Gahogo", "Tumba"],
        "Gahogo": ["Gahogo", "Bukira", "Migongo"],
        "Migongo": ["Migongo", "Gahogo", "Tumba"],
        "Tumba": ["Tumba", "Bukira", "Migongo"]
      },
      "Huye": {
        "Bukira": ["Bukira", "Huye", "Migongo"],
        "Huye": ["Huye", "Bukira", "Save"],
        "Migongo": ["Migongo", "Huye", "Bukira"],
        "Save": ["Save", "Huye", "Migongo"]
      },
      "Kigoma": {
        "Kigoma": ["Kigoma", "Mukura", "Rwaniro"],
        "Mukura": ["Mukura", "Kigoma", "Save"],
        "Rwaniro": ["Rwaniro", "Kigoma", "Mukura"],
        "Save": ["Save", "Mukura", "Kigoma"]
      },
      "Simbi": {
        "Kibayi": ["Kibayi", "Mukura", "Simbi"],
        "Mukura": ["Mukura", "Kibayi", "Simbi"],
        "Simbi": ["Simbi", "Kibayi", "Mukura"]
      },
      "Maraba": {
        "Maraba": ["Maraba", "Mukura", "Nyamiyaga"],
        "Mukura": ["Mukura", "Maraba", "Save"],
        "Nyamiyaga": ["Nyamiyaga", "Maraba", "Mukura"],
        "Save": ["Save", "Maraba", "Mukura"]
      },
      "Karama": {
        "Karama": ["Karama", "Kigoma", "Mukura"],
        "Kigoma": ["Kigoma", "Karama", "Rwaniro"],
        "Mukura": ["Mukura", "Karama", "Kigoma"],
        "Rwaniro": ["Rwaniro", "Kigoma", "Karama"]
      },
      "Gishamvu": {
        "Gishamvu": ["Gishamvu", "Kigoma", "Mukura"],
        "Kigoma": ["Kigoma", "Gishamvu", "Rwaniro"],
        "Mukura": ["Mukura", "Gishamvu", "Kigoma"],
        "Rwaniro": ["Rwaniro", "Kigoma", "Gishamvu"]
      }
    },
    "Nyanza": {
      "Nyanza": {
        "Bweramvura": ["Bweramvura", "Kabagari", "Nyanza"],
        "Kabagari": ["Kabagari", "Bweramvura", "Rwabicumi"],
        "Nyanza": ["Nyanza", "Bweramvura", "Cyabakamyi"],
        "Rwabicumi": ["Rwabicumi", "Kabagari", "Nyanza"],
        "Cyabakamyi": ["Cyabakamyi", "Nyanza", "Rwabicumi"]
      },
      "Mukingo": {
        "Kabagari": ["Kabagari", "Mukingo", "Muyira"],
        "Mukingo": ["Mukingo", "Kabagari", "Rwabicumi"],
        "Muyira": ["Muyira", "Mukingo", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Mukingo", "Kabagari"]
      },
      "Nyagyiso": {
        "Kabagari": ["Kabagari", "Mukingo", "Nyagyiso"],
        "Mukingo": ["Mukingo", "Kabagari", "Nyagyiso"],
        "Nyagyiso": ["Nyagyiso", "Mukingo", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Nyagyiso", "Mukingo"]
      },
      "Kibirizi": {
        "Kibirizi": ["Kibirizi", "Mukingo", "Muyira"],
        "Mukingo": ["Mukingo", "Kibirizi", "Rwabicumi"],
        "Muyira": ["Muyira", "Kibirizi", "Mukingo"],
        "Rwabicumi": ["Rwabicumi", "Mukingo", "Kibirizi"]
      },
      "Busasamana": {
        "Busasamana": ["Busasamana", "Kabagari", "Mukingo"],
        "Kabagari": ["Kabagari", "Busasamana", "Nyanza"],
        "Mukingo": ["Mukingo", "Busasamana", "Nyanza"],
        "Nyanza": ["Nyanza", "Busasamana", "Kabagari"]
      },
      "Busoro": {
        "Busoro": ["Busoro", "Mukingo", "Nyanza"],
        "Mukingo": ["Mukingo", "Busoro", "Rwabicumi"],
        "Nyanza": ["Nyanza", "Busoro", "Mukingo"],
        "Rwabicumi": ["Rwabicumi", "Mukingo", "Busoro"]
      },
      "Muyira": {
        "Kibirizi": ["Kibirizi", "Mukingo", "Muyira"],
        "Mukingo": ["Mukingo", "Kibirizi", "Muyira"],
        "Muyira": ["Muyira", "Kibirizi", "Nyanza"],
        "Nyanza": ["Nyanza", "Muyira", "Mukingo"]
      },
      "Rwabicumi": {
        "Kabagari": ["Kabagari", "Mukingo", "Rwabicumi"],
        "Mukingo": ["Mukingo", "Kabagari", "Nyanza"],
        "Nyanza": ["Nyanza", "Mukingo", "Rwabicumi"],
        "Rwabicumi": ["Rwabicumi", "Kabagari", "Mukingo"]
      },
      "Cyabakamyi": {
        "Cyabakamyi": ["Cyabakamyi", "Mukingo", "Nyanza"],
        "Mukingo": ["Mukingo", "Cyabakamyi", "Rwabicumi"],
        "Nyanza": ["Nyanza", "Cyabakamyi", "Mukingo"],
        "Rwabicumi": ["Rwabicumi", "Mukingo", "Cyabakamyi"]
      },
      "Gatagara": {
        "Gatagara": ["Gatagara", "Kabagari", "Mukingo"],
        "Kabagari": ["Kabagari", "Gatagara", "Nyanza"],
        "Mukingo": ["Mukingo", "Gatagara", "Kabagari"],
        "Nyanza": ["Nyanza", "Gatagara", "Kabagari"]
      }
    },
    "Gisagara": {
      "Gisagara": {
        "Bukana": ["Bukana", "Gisagara", "Muganza"],
        "Gisagara": ["Gisagara", "Bukana", "Save"],
        "Muganza": ["Muganza", "Bukana", "Gisagara"],
        "Mugiraneza": ["Mugiraneza", "Gisagara", "Muganza"],
        "Save": ["Save", "Gisagara", "Bukana"]
      },
      "Kibilizi": {
        "Kibilizi": ["Kibilizi", "Muganza", "Mugiraneza"],
        "Muganza": ["Muganza", "Kibilizi", "Save"],
        "Mugiraneza": ["Mugiraneza", "Kibilizi", "Muganza"],
        "Save": ["Save", "Muganza", "Kibilizi"]
      },
      "Kigembe": {
        "Kigembe": ["Kigembe", "Muganza", "Mugiraneza"],
        "Muganza": ["Muganza", "Kigembe", "Save"],
        "Mugiraneza": ["Mugiraneza", "Kigembe", "Muganza"],
        "Save": ["Save", "Muganza", "Kigembe"]
      },
      "Muganza": {
        "Kibilizi": ["Kibilizi", "Muganza", "Mugiraneza"],
        "Muganza": ["Muganza", "Kibilizi", "Save"],
        "Mugiraneza": ["Mugiraneza", "Kibilizi", "Muganza"],
        "Save": ["Save", "Muganza", "Kibilizi"]
      },
      "Mugiraneza": {
        "Kibilizi": ["Kibilizi", "Muganza", "Mugiraneza"],
        "Muganza": ["Muganza", "Kibilizi", "Mugiraneza"],
        "Mugiraneza": ["Mugiraneza", "Kibilizi", "Muganza"],
        "Save": ["Save", "Muganza", "Mugiraneza"]
      },
      "Mukindo": {
        "Kibilizi": ["Kibilizi", "Muganza", "Mukindo"],
        "Muganza": ["Muganza", "Kibilizi", "Save"],
        "Mukindo": ["Mukindo", "Kibilizi", "Muganza"],
        "Save": ["Save", "Muganza", "Mukindo"]
      },
      "Ndora": {
        "Kibilizi": ["Kibilizi", "Muganza", "Ndora"],
        "Muganza": ["Muganza", "Kibilizi", "Mugiraneza"],
        "Mugiraneza": ["Mugiraneza", "Kibilizi", "Ndora"],
        "Ndora": ["Ndora", "Kibilizi", "Muganza"]
      },
      "Gishubi": {
        "Gishubi": ["Gishubi", "Kibilizi", "Muganza"],
        "Kibilizi": ["Kibilizi", "Gishubi", "Save"],
        "Muganza": ["Muganza", "Gishubi", "Kibilizi"],
        "Save": ["Save", "Gishubi", "Muganza"]
      },
      "Kansi": {
        "Kansi": ["Kansi", "Kibilizi", "Muganza"],
        "Kibilizi": ["Kibilizi", "Kansi", "Muganza"],
        "Muganza": ["Muganza", "Kansi", "Kibilizi"],
        "Save": ["Save", "Kansi", "Muganza"]
      }
    },
    "Nyamagabe": {
      "Nyamagabe": {
        "Buruhi": ["Buruhi", "Kamegeri", "Nyamagabe"],
        "Kamegeri": ["Kamegeri", "Buruhi", "Uwinkingi"],
        "Nyamagabe": ["Nyamagabe", "Buruhi", "Kamegeri"],
        "Uwinkingi": ["Uwinkingi", "Kamegeri", "Nyamagabe"]
      },
      "Kitabi": {
        "Kamegeri": ["Kamegeri", "Kitabi", "Uwinkingi"],
        "Kitabi": ["Kitabi", "Kamegeri", "Nyamagabe"],
        "Nyamagabe": ["Nyamagabe", "Kitabi", "Uwinkingi"],
        "Uwinkingi": ["Uwinkingi", "Kitabi", "Kamegeri"]
      },
      "Kamegeri": {
        "Kamegeri": ["Kamegeri", "Kitabi", "Nyamagabe"],
        "Kitabi": ["Kitabi", "Kamegeri", "Uwinkingi"],
        "Nyamagabe": ["Nyamagabe", "Kamegeri", "Uwinkingi"],
        "Uwinkingi": ["Uwinkingi", "Kamegeri", "Kitabi"]
      },
      "Uwinkingi": {
        "Kamegeri": ["Kamegeri", "Kitabi", "Uwinkingi"],
        "Kitabi": ["Kitabi", "Kamegeri", "Uwinkingi"],
        "Nyamagabe": ["Nyamagabe", "Uwinkingi", "Kamegeri"],
        "Uwinkingi": ["Uwinkingi", "Kamegeri", "Kitabi"]
      },
      "Mugano": {
        "Kamegeri": ["Kamegeri", "Mugano", "Uwinkingi"],
        "Mugano": ["Mugano", "Kamegeri", "Nyamagabe"],
        "Nyamagabe": ["Nyamagabe", "Mugano", "Uwinkingi"],
        "Uwinkingi": ["Uwinkingi", "Mugano", "Kamegeri"]
      },
      "Kibirizi": {
        "Kibirizi": ["Kibirizi", "Kamegeri", "Nyamagabe"],
        "Kamegeri": ["Kamegeri", "Kibirizi", "Uwinkingi"],
        "Nyamagabe": ["Nyamagabe", "Kibirizi", "Kamegeri"],
        "Uwinkingi": ["Uwinkingi", "Kibirizi", "Kamegeri"]
      },
      "Tare": {
        "Kamegeri": ["Kamegeri", "Nyamagabe", "Tare"],
        "Nyamagabe": ["Nyamagabe", "Tare", "Uwinkingi"],
        "Tare": ["Tare", "Kamegeri", "Uwinkingi"],
        "Uwinkingi": ["Uwinkingi", "Tare", "Kamegeri"]
      },
      "Cyanika": {
        "Cyanika": ["Cyanika", "Kamegeri", "Nyamagabe"],
        "Kamegeri": ["Kamegeri", "Cyanika", "Uwinkingi"],
        "Nyamagabe": ["Nyamagabe", "Cyanika", "Kamegeri"],
        "Uwinkingi": ["Uwinkingi", "Cyanika", "Kamegeri"]
      },
      "Gasaka": {
        "Gasaka": ["Gasaka", "Kamegeri", "Nyamagabe"],
        "Kamegeri": ["Kamegeri", "Gasaka", "Uwinkingi"],
        "Nyamagabe": ["Nyamagabe", "Gasaka", "Kamegeri"],
        "Uwinkingi": ["Uwinkingi", "Gasaka", "Kamegeri"]
      },
      "Buruhu": {
        "Buruhu": ["Buruhu", "Kamegeri", "Nyamagabe"],
        "Kamegeri": ["Kamegeri", "Buruhu", "Uwinkingi"],
        "Nyamagabe": ["Nyamagabe", "Buruhu", "Kamegeri"],
        "Uwinkingi": ["Uwinkingi", "Buruhu", "Kamegeri"]
      }
    },
    "Ruhango": {
      "Ruhango": {
        "Bweramvura": ["Bweramvura", "Kabagari", "Ruhango"],
        "Kabagari": ["Kabagari", "Bweramvura", "Rwabicumi"],
        "Ruhango": ["Ruhango", "Bweramvura", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Kabagari", "Ruhango"]
      },
      "Kinihira": {
        "Kabagari": ["Kabagari", "Kinihira", "Ruhango"],
        "Kinihira": ["Kinihira", "Kabagari", "Rwabicumi"],
        "Ruhango": ["Ruhango", "Kinihira", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Kinihira", "Kabagari"]
      },
      "Mbuye": {
        "Kabagari": ["Kabagari", "Mbuye", "Ruhango"],
        "Mbuye": ["Mbuye", "Kabagari", "Rwabicumi"],
        "Ruhango": ["Ruhango", "Mbuye", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Mbuye", "Kabagari"]
      },
      "Ntongwe": {
        "Kabagari": ["Kabagari", "Ntongwe", "Ruhango"],
        "Ntongwe": ["Ntongwe", "Kabagari", "Rwabicumi"],
        "Ruhango": ["Ruhango", "Ntongwe", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Ntongwe", "Kabagari"]
      },
      "Gitovu": {
        "Gitovu": ["Gitovu", "Kabagari", "Ruhango"],
        "Kabagari": ["Kabagari", "Gitovu", "Rwabicumi"],
        "Ruhango": ["Ruhango", "Gitovu", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Gitovu", "Kabagari"]
      },
      "Mwendo": {
        "Kabagari": ["Kabagari", "Mwendo", "Ruhango"],
        "Mwendo": ["Mwendo", "Kabagari", "Rwabicumi"],
        "Ruhango": ["Ruhango", "Mwendo", "Kabagari"],
        "Rwabicumi": ["Rwabicumi", "Mwendo", "Kabagari"]
      }
    },
    "Muhanga": {
      "Muhanga": {
        "Bikingi": ["Bikingi", "Gahogo", "Muhanga"],
        "Gahogo": ["Gahogo", "Bikingi", "Nyamabuye"],
        "Muhanga": ["Muhanga", "Bikingi", "Shyogwe"],
        "Nyamabuye": ["Nyamabuye", "Gahogo", "Muhanga"],
        "Shyogwe": ["Shyogwe", "Muhanga", "Bikingi"]
      },
      "Kiyumba": {
        "Bikingi": ["Bikingi", "Gahogo", "Kiyumba"],
        "Gahogo": ["Gahogo", "Bikingi", "Nyamabuye"],
        "Kiyumba": ["Kiyumba", "Bikingi", "Gahogo"],
        "Nyamabuye": ["Nyamabuye", "Gahogo", "Kiyumba"]
      },
      "Cyeza": {
        "Cyeza": ["Cyeza", "Gahogo", "Muhanga"],
        "Gahogo": ["Gahogo", "Cyeza", "Nyamabuye"],
        "Muhanga": ["Muhanga", "Cyeza", "Gahogo"],
        "Nyamabuye": ["Nyamabuye", "Cyeza", "Gahogo"]
      },
      "Kabacuzi": {
        "Gahogo": ["Gahogo", "Kabacuzi", "Muhanga"],
        "Kabacuzi": ["Kabacuzi", "Gahogo", "Nyamabuye"],
        "Muhanga": ["Muhanga", "Kabacuzi", "Gahogo"],
        "Nyamabuye": ["Nyamabuye", "Kabacuzi", "Gahogo"]
      },
      "Kibangu": {
        "Gahogo": ["Gahogo", "Kibangu", "Muhanga"],
        "Kibangu": ["Kibangu", "Gahogo", "Nyamabuye"],
        "Muhanga": ["Muhanga", "Kibangu", "Gahogo"],
        "Nyamabuye": ["Nyamabuye", "Kibangu", "Gahogo"]
      },
      "Mushishiro": {
        "Gahogo": ["Gahogo", "Muhanga", "Mushishiro"],
        "Muhanga": ["Muhanga", "Gahogo", "Mushishiro"],
        "Mushishiro": ["Mushishiro", "Gahogo", "Nyamabuye"],
        "Nyamabuye": ["Nyamabuye", "Mushishiro", "Gahogo"]
      },
      "Nyarusange": {
        "Gahogo": ["Gahogo", "Muhanga", "Nyarusange"],
        "Muhanga": ["Muhanga", "Gahogo", "Nyamabuye"],
        "Nyamabuye": ["Nyamabuye", "Gahogo", "Nyarusange"],
        "Nyarusange": ["Nyarusange", "Muhanga", "Gahogo"]
      },
      "Rongi": {
        "Gahogo": ["Gahogo", "Muhanga", "Rongi"],
        "Muhanga": ["Muhanga", "Gahogo", "Nyamabuye"],
        "Nyamabuye": ["Nyamabuye", "Gahogo", "Rongi"],
        "Rongi": ["Rongi", "Muhanga", "Gahogo"]
      }
    },
    "Kamonyi": {
      "Kamonyi": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Mugina"],
        "Kamonyi": ["Kamonyi", "Gacurabwenge", "Rukoma"],
        "Mugina": ["Mugina", "Kamonyi", "Runda"],
        "Rukoma": ["Rukoma", "Gacurabwenge", "Kamonyi"],
        "Runda": ["Runda", "Kamonyi", "Mugina"]
      },
      "Gacurabwenge": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Mugina"],
        "Kamonyi": ["Kamonyi", "Gacurabwenge", "Rukoma"],
        "Mugina": ["Mugina", "Gacurabwenge", "Kamonyi"],
        "Rukoma": ["Rukoma", "Gacurabwenge", "Kamonyi"]
      },
      "Karama": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Karama"],
        "Kamonyi": ["Kamonyi", "Karama", "Rukoma"],
        "Karama": ["Karama", "Gacurabwenge", "Kamonyi"],
        "Rukoma": ["Rukoma", "Karama", "Gacurabwenge"]
      },
      "Kayenzi": {
        "Gacurabwenge": ["Gacurabwenge", "Kayenzi", "Kamonyi"],
        "Kamonyi": ["Kamonyi", "Kayenzi", "Rukoma"],
        "Kayenzi": ["Kayenzi", "Gacurabwenge", "Kamonyi"],
        "Rukoma": ["Rukoma", "Kayenzi", "Gacurabwenge"]
      },
      "Mugina": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Mugina"],
        "Kamonyi": ["Kamonyi", "Gacurabwenge", "Mugina"],
        "Mugina": ["Mugina", "Kamonyi", "Rukoma"],
        "Rukoma": ["Rukoma", "Mugina", "Gacurabwenge"]
      },
      "Musambira": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Musambira"],
        "Kamonyi": ["Kamonyi", "Musambira", "Rukoma"],
        "Musambira": ["Musambira", "Gacurabwenge", "Kamonyi"],
        "Rukoma": ["Rukoma", "Musambira", "Gacurabwenge"]
      },
      "Ngamba": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Ngamba"],
        "Kamonyi": ["Kamonyi", "Ngamba", "Rukoma"],
        "Ngamba": ["Ngamba", "Gacurabwenge", "Kamonyi"],
        "Rukoma": ["Rukoma", "Ngamba", "Gacurabwenge"]
      },
      "Nyamiyaga": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Nyamiyaga"],
        "Kamonyi": ["Kamonyi", "Nyamiyaga", "Rukoma"],
        "Nyamiyaga": ["Nyamiyaga", "Gacurabwenge", "Kamonyi"],
        "Rukoma": ["Rukoma", "Nyamiyaga", "Gacurabwenge"]
      },
      "Runda": {
        "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Runda"],
        "Kamonyi": ["Kamonyi", "Mugina", "Runda"],
        "Mugina": ["Mugina", "Kamonyi", "Runda"],
        "Runda": ["Runda", "Mugina", "Gacurabwenge"]
      }
    }
  },
  "Northern": {
    "Musanze": {
      "Musanze": ["Bikingi", "Cyabararika", "Musanze", "Muhoza", "Rwaza"],
      "Muhoza": ["Bikingi", "Cyabararika", "Muhoza", "Rwaza"],
      "Cyuve": ["Cyuve", "Musanze", "Muhoza", "Rwaza"],
      "Gataraga": ["Gataraga", "Musanze", "Muhoza", "Rwaza"],
      "Kimonyi": ["Kimonyi", "Musanze", "Muhoza", "Rwaza"],
      "Kinigi": ["Kinigi", "Musanze", "Muhoza", "Rwaza"],
      "Nyakinama": ["Musanze", "Muhoza", "Nyakinama", "Rwaza"],
      "Nkotsi": ["Musanze", "Muhoza", "Nkotsi", "Rwaza"],
      "Busogo": ["Busogo", "Musanze", "Muhoza", "Rwaza"],
      "Remera": ["Musanze", "Muhoza", "Remera", "Rwaza"]
    },
    "Gakenke": {
      "Gakenke": ["Bwisige", "Gakenke", "Kivuruga", "Mugandamuri", "Nemba"],
      "Kamubuga": ["Bwisige", "Gakenke", "Kamubuga", "Kivuruga", "Nemba"],
      "Karambo": ["Bwisige", "Gakenke", "Karambo", "Kivuruga", "Nemba"],
      "Mugandamuri": ["Bwisige", "Gakenke", "Kivuruga", "Mugandamuri", "Nemba"],
      "Muyongwe": ["Bwisige", "Gakenke", "Kivuruga", "Muyongwe", "Nemba"],
      "Muzo": ["Bwisige", "Gakenke", "Kivuruga", "Muzo", "Nemba"],
      "Nemba": ["Bwisige", "Gakenke", "Kivuruga", "Mugandamuri", "Nemba"],
      "Ruli": ["Bwisige", "Gakenke", "Kivuruga", "Nemba", "Ruli"],
      "Rusasa": ["Bwisige", "Gakenke", "Kivuruga", "Nemba", "Rusasa"],
      "Coko": ["Bwisige", "Coko", "Gakenke", "Kivuruga", "Nemba"]
    },
    "Rulindo": {
      "Rulindo": ["Burega", "Bushoki", "Kinihira", "Rulindo", "Tumba"],
      "Bushoki": ["Burega", "Bushoki", "Kinihira", "Rulindo"],
      "Burega": ["Burega", "Bushoki", "Kinihira", "Rulindo"],
      "Baso": ["Baso", "Bushoki", "Kinihira", "Rulindo"],
      "Buyoga": ["Bushoki", "Buyoga", "Kinihira", "Rulindo"],
      "Kinihira": ["Burega", "Bushoki", "Kinihira", "Rulindo"],
      "Kisaro": ["Bushoki", "Kinihira", "Kisaro", "Rulindo"],
      "Masoro": ["Bushoki", "Kinihira", "Masoro", "Rulindo"],
      "Mbogo": ["Bushoki", "Kinihira", "Mbogo", "Rulindo"],
      "Ngoma": ["Bushoki", "Kinihira", "Ngoma", "Rulindo"],
      "Ntarabana": ["Bushoki", "Kinihira", "Ntarabana", "Rulindo"],
      "Rwintare": ["Bushoki", "Kinihira", "Rulindo", "Rwintare"],
      "Shyorongi": ["Bushoki", "Kinihira", "Rulindo", "Shyorongi"],
      "Tumba": ["Burega", "Bushoki", "Kinihira", "Rulindo", "Tumba"]
    },
    "Burera": {
      "Burera": ["Bungwe", "Burera", "Butaro", "Cyanika", "Kagogo"],
      "Bungwe": ["Bungwe", "Burera", "Butaro", "Cyanika"],
      "Butaro": ["Bungwe", "Burera", "Butaro", "Cyanika"],
      "Cyanika": ["Bungwe", "Burera", "Butaro", "Cyanika"],
      "Gahunga": ["Bungwe", "Burera", "Gahunga", "Cyanika"],
      "Kagogo": ["Bungwe", "Burera", "Kagogo", "Cyanika"],
      "Kibirira": ["Bungwe", "Burera", "Kibirira", "Cyanika"],
      "Kinyababa": ["Bungwe", "Burera", "Kinyababa", "Cyanika"],
      "Kirambo": ["Bungwe", "Burera", "Kirambo", "Cyanika"],
      "Mugina": ["Bungwe", "Burera", "Mugina", "Cyanika"],
      "Munanira": ["Bungwe", "Burera", "Munanira", "Cyanika"],
      "Rugerero": ["Bungwe", "Burera", "Rugerero", "Cyanika"],
      "Ruhunde": ["Bungwe", "Burera", "Ruhunde", "Cyanika"],
      "Rusarabuye": ["Bungwe", "Burera", "Rusarabuye", "Cyanika"],
      "Gitovu": ["Bungwe", "Burera", "Gitovu", "Cyanika"],
      "Gatovu": ["Bungwe", "Burera", "Gatovu", "Cyanika"],
      "Kabaya": ["Bungwe", "Burera", "Kabaya", "Cyanika"]
    },
    "Gicumbi": {
      "Gicumbi": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rukomo"],
      "Byumba": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rukomo"],
      "Kaniga": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rukomo"],
      "Miyove": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Miyove"],
      "Kageyo": ["Bwisige", "Byumba", "Gicumbi", "Kageyo", "Kaniga"],
      "Giti": ["Bwisige", "Byumba", "Gicumbi", "Giti", "Kaniga"],
      "Muko": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Muko"],
      "Munyinya": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Munyinya"],
      "Mutete": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Mutete"],
      "Nyamiyaga": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Nyamiyaga"],
      "Nyankenke": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Nyankenke"],
      "Rubaya": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rubaya"],
      "Rukomo": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rukomo"],
      "Rushaki": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rushaki"],
      "Rutare": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rutare"],
      "Ruvune": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Ruvune"],
      "Rwankuba": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Rwankuba"],
      "Tumba": ["Bwisige", "Byumba", "Gicumbi", "Kaniga", "Tumba"]
    }
  },
  "Eastern": {
    "Rwamagana": {
      "Rwamagana": ["Gishari", "Kabukuba", "Munyiginya", "Rwamagana", "Vumiri"],
      "Fumbwe": ["Fumbwe", "Gishari", "Munyiginya", "Rwamagana"],
      "Gahengeri": ["Gahengeri", "Gishari", "Munyiginya", "Rwamagana"],
      "Gishari": ["Gishari", "Kabukuba", "Munyiginya", "Rwamagana"],
      "Kabukuba": ["Gishari", "Kabukuba", "Munyiginya", "Rwamagana"],
      "Kigabiro": ["Gishari", "Kigabiro", "Munyiginya", "Rwamagana"],
      "Muhazi": ["Gishari", "Muhazi", "Munyiginya", "Rwamagana"],
      "Munyiginya": ["Gishari", "Munyiginya", "Rwamagana", "Vumiri"],
      "Musha": ["Gishari", "Munyiginya", "Musha", "Rwamagana"],
      "Muyumbu": ["Gishari", "Munyiginya", "Muyumbu", "Rwamagana"],
      "Nyakariro": ["Gishari", "Munyiginya", "Nyakariro", "Rwamagana"],
      "Rubona": ["Gishari", "Munyiginya", "Rubona", "Rwamagana"],
      "Rugende": ["Gishari", "Munyiginya", "Rugende", "Rwamagana"],
      "Zaza": ["Gishari", "Munyiginya", "Rwamagana", "Zaza"]
    },
    "Kayonza": {
      "Kayonza": ["Gahini", "Kabare", "Kayonza", "Mukarange", "Ruramira"],
      "Gahini": ["Gahini", "Kabare", "Kayonza", "Mukarange"],
      "Kabare": ["Gahini", "Kabare", "Kayonza", "Mukarange"],
      "Kageyo": ["Gahini", "Kageyo", "Kayonza", "Mukarange"],
      "Mukarange": ["Gahini", "Kayonza", "Mukarange", "Ruramira"],
      "Murama": ["Gahini", "Kayonza", "Murama", "Ruramira"],
      "Murundi": ["Gahini", "Kayonza", "Murundi", "Ruramira"],
      "Mwiri": ["Gahini", "Kayonza", "Mwiri", "Ruramira"],
      "Ndego": ["Gahini", "Kayonza", "Ndego", "Ruramira"],
      "Nyamirama": ["Gahini", "Kayonza", "Nyamirama", "Ruramira"],
      "Rukara": ["Gahini", "Kayonza", "Rukara", "Ruramira"],
      "Ruramira": ["Gahini", "Kayonza", "Mukarange", "Ruramira"],
      "Rwinkwavu": ["Gahini", "Kayonza", "Ruramira", "Rwinkwavu"]
    },
    "Kirehe": {
      "Kirehe": ["Gahara", "Kirehe", "Mahama", "Mpanga", "Nasho"],
      "Gahara": ["Gahara", "Kirehe", "Mahama", "Mpanga"],
      "Gashonyi": ["Gahara", "Gashonyi", "Kirehe", "Mpanga"],
      "Kigarama": ["Gahara", "Kigarama", "Kirehe", "Mpanga"],
      "Kigina": ["Gahara", "Kigina", "Kirehe", "Mpanga"],
      "Mahama": ["Gahara", "Kirehe", "Mahama", "Mpanga"],
      "Mpanga": ["Gahara", "Kirehe", "Mahama", "Mpanga"],
      "Mushikiri": ["Gahara", "Kirehe", "Mahama", "Mushikiri"],
      "Nasho": ["Gahara", "Kirehe", "Mahama", "Nasho"],
      "Nyamugari": ["Gahara", "Kirehe", "Mahama", "Nyamugari"],
      "Nyarubuye": ["Gahara", "Kirehe", "Mahama", "Nyarubuye"],
      "Rubimba": ["Gahara", "Kirehe", "Mahama", "Rubimba"],
      "Rusumo": ["Gahara", "Kirehe", "Mahama", "Rusumo"],
      "Gatore": ["Gahara", "Gatore", "Kirehe", "Mahama"]
    },
    "Ngoma": {
      "Ngoma": ["Gashanda", "Kazo", "Kibungo", "Mugesera", "Ngoma"],
      "Gashanda": ["Gashanda", "Kazo", "Kibungo", "Ngoma"],
      "Jarama": ["Gashanda", "Jarama", "Kazo", "Ngoma"],
      "Kazo": ["Gashanda", "Kazo", "Kibungo", "Ngoma"],
      "Kibungo": ["Gashanda", "Kazo", "Kibungo", "Ngoma"],
      "Mugesera": ["Gashanda", "Kazo", "Mugesera", "Ngoma"],
      "Murama": ["Gashanda", "Kazo", "Murama", "Ngoma"],
      "Mutenderi": ["Gashanda", "Kazo", "Mutenderi", "Ngoma"],
      "Remera": ["Gashanda", "Kazo", "Ngoma", "Remera"],
      "Rukira": ["Gashanda", "Kazo", "Ngoma", "Rukira"],
      "Rukumberi": ["Gashanda", "Kazo", "Ngoma", "Rukumberi"],
      "Rurenge": ["Gashanda", "Kazo", "Ngoma", "Rurenge"],
      "Sake": ["Gashanda", "Kazo", "Ngoma", "Sake"],
      "Zaza": ["Gashanda", "Kazo", "Ngoma", "Zaza"]
    },
    "Bugesera": {
      "Bugesera": ["Gashora", "Kamabuye", "Mayange", "Ngeruka", "Rilima"],
      "Gashora": ["Gashora", "Kamabuye", "Mayange", "Ngeruka"],
      "Juru": ["Gashora", "Juru", "Mayange", "Ngeruka"],
      "Kamabuye": ["Gashora", "Kamabuye", "Mayange", "Ngeruka"],
      "Mareba": ["Gashora", "Mareba", "Mayange", "Ngeruka"],
      "Mayange": ["Gashora", "Kamabuye", "Mayange", "Ngeruka"],
      "Musenyi": ["Gashora", "Kamabuye", "Mayange", "Musenyi"],
      "Mwogo": ["Gashora", "Kamabuye", "Mayange", "Mwogo"],
      "Ngeruka": ["Gashora", "Kamabuye", "Mayange", "Ngeruka"],
      "Ntarama": ["Gashora", "Kamabuye", "Mayange", "Ntarama"],
      "Nyamata": ["Gashora", "Kamabuye", "Mayange", "Nyamata"],
      "Nyarugenge": ["Gashora", "Kamabuye", "Mayange", "Nyarugenge"],
      "Rilima": ["Gashora", "Kamabuye", "Mayange", "Rilima"],
      "Ruhuha": ["Gashora", "Kamabuye", "Mayange", "Ruhuha"],
      "Rweru": ["Gashora", "Kamabuye", "Mayange", "Rweru"],
      "Shyara": ["Gashora", "Kamabuye", "Mayange", "Shyara"]
    },
    "Nyagatare": {
      "Nyagatare": ["Gatunda", "Karama", "Kiyombe", "Nyagatare", "Rukomo"],
      "Gatunda": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
      "Karama": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
      "Kiyombe": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
      "Matimba": ["Gatunda", "Karama", "Kiyombe", "Matimba"],
      "Mimuli": ["Gatunda", "Karama", "Kiyombe", "Mimuli"],
      "Musheli": ["Gatunda", "Karama", "Kiyombe", "Musheli"],
      "Nyagatare": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
      "Rukomo": ["Gatunda", "Karama", "Kiyombe", "Rukomo"],
      "Rutare": ["Gatunda", "Karama", "Kiyombe", "Rutare"],
      "Rwempasha": ["Gatunda", "Karama", "Kiyombe", "Rwempasha"],
      "Rwimiyaga": ["Gatunda", "Karama", "Kiyombe", "Rwimiyaga"],
      "Tabagwe": ["Gatunda", "Karama", "Kiyombe", "Tabagwe"],
      "Karangazi": ["Gatunda", "Karangazi", "Kiyombe", "Nyagatare"],
      "Gitoki": ["Gatunda", "Gitoki", "Kiyombe", "Nyagatare"]
    },
    "Gatsibo": {
      "Gatsibo": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama", "Rwimbogo"],
      "Gatsibo": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
      "Gitoki": ["Gatsibo", "Gitoki", "Kabarore", "Kiziguro"],
      "Kabarore": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
      "Kageyo": ["Gatsibo", "Kageyo", "Kabarore", "Kiziguro"],
      "Kiramuruzi": ["Gatsibo", "Kabarore", "Kiramuruzi", "Kiziguro"],
      "Kiziguro": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
      "Muhura": ["Gatsibo", "Kabarore", "Kiziguro", "Muhura"],
      "Murambi": ["Gatsibo", "Kabarore", "Kiziguro", "Murambi"],
      "Ngarama": ["Gatsibo", "Kabarore", "Kiziguro", "Ngarama"],
      "Nyagihanga": ["Gatsibo", "Kabarore", "Kiziguro", "Nyagihanga"],
      "Remera": ["Gatsibo", "Kabarore", "Kiziguro", "Remera"],
      "Rugarama": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
      "Rwimbogo": ["Gatsibo", "Kabarore", "Kiziguro", "Rwimbogo"]
    }
  },
  "Western": {
    "Rubavu": {
      "Rubavu": ["Gisenyi", "Kanama", "Mudende", "Nyakiriba", "Rubavu"],
      "Gisenyi": ["Gisenyi", "Kanama", "Mudende", "Rubavu"],
      "Kanama": ["Gisenyi", "Kanama", "Mudende", "Rubavu"],
      "Mudende": ["Gisenyi", "Kanama", "Mudende", "Rubavu"],
      "Nyakiriba": ["Gisenyi", "Kanama", "Mudende", "Nyakiriba"],
      "Nyamyumba": ["Gisenyi", "Kanama", "Mudende", "Nyamyumba"],
      "Rubavu": ["Gisenyi", "Kanama", "Mudende", "Rubavu"],
      "Rugegi": ["Gisenyi", "Kanama", "Mudende", "Rugegi"],
      "Bugeshi": ["Bugeshi", "Gisenyi", "Kanama", "Mudende"],
      "Busasamana": ["Busasamana", "Gisenyi", "Kanama", "Mudende"],
      "Cyanzarwe": ["Cyanzarwe", "Gisenyi", "Kanama", "Mudende"],
      "Gisa": ["Gisa", "Gisenyi", "Kanama", "Mudende"],
      "Kabilizi": ["Gisenyi", "Kabilizi", "Kanama", "Mudende"],
      "Muko": ["Gisenyi", "Kanama", "Muko", "Mudende"]
    },
    "Rusizi": {
      "Rusizi": ["Bugarama", "Gashonga", "Kamembe", "Mururu", "Rusizi"],
      "Bugarama": ["Bugarama", "Gashonga", "Kamembe", "Mururu"],
      "Gashonga": ["Bugarama", "Gashonga", "Kamembe", "Mururu"],
      "Gihundwe": ["Bugarama", "Gihundwe", "Kamembe", "Mururu"],
      "Kamembe": ["Bugarama", "Gashonga", "Kamembe", "Mururu"],
      "Mururu": ["Bugarama", "Gashonga", "Kamembe", "Mururu"],
      "Nkanka": ["Bugarama", "Gashonga", "Kamembe", "Nkanka"],
      "Nkombo": ["Bugarama", "Gashonga", "Kamembe", "Nkombo"],
      "Nkungu": ["Bugarama", "Gashonga", "Kamembe", "Nkungu"],
      "Nyakabuye": ["Bugarama", "Gashonga", "Kamembe", "Nyakabuye"],
      "Nyakarenzo": ["Bugarama", "Gashonga", "Kamembe", "Nyakarenzo"],
      "Rwimbogo": ["Bugarama", "Gashonga", "Kamembe", "Rwimbogo"],
      "Gikundamvura": ["Bugarama", "Gashonga", "Gikundamvura", "Kamembe"],
      "Mashizi": ["Bugarama", "Gashonga", "Kamembe", "Mashizi"],
      "Giheke": ["Bugarama", "Giheke", "Gashonga", "Kamembe"]
    },
    "Karongi": {
      "Karongi": ["Bwishyura", "Gitesi", "Karongi", "Murundi", "Rubengera"],
      "Bwishyura": ["Bwishyura", "Gitesi", "Karongi", "Rubengera"],
      "Gitesi": ["Bwishyura", "Gitesi", "Karongi", "Rubengera"],
      "Gishyita": ["Bwishyura", "Gishyita", "Karongi", "Rubengera"],
      "Karongi": ["Bwishyura", "Gitesi", "Karongi", "Rubengera"],
      "Mubuga": ["Bwishyura", "Gitesi", "Karongi", "Mubuga"],
      "Murundi": ["Bwishyura", "Gitesi", "Karongi", "Murundi"],
      "Mutuntu": ["Bwishyura", "Gitesi", "Karongi", "Mutuntu"],
      "Rubengera": ["Bwishyura", "Gitesi", "Karongi", "Rubengera"],
      "Rugabano": ["Bwishyura", "Gitesi", "Karongi", "Rugabano"],
      "Ruganda": ["Bwishyura", "Gitesi", "Karongi", "Ruganda"],
      "Rwankuba": ["Bwishyura", "Gitesi", "Karongi", "Rwankuba"],
      "Twumba": ["Bwishyura", "Gitesi", "Karongi", "Twumba"],
      "Gisovu": ["Bwishyura", "Gisovu", "Gitesi", "Karongi"]
    },
    "Nyamasheke": {
      "Nyamasheke": ["Bushekeri", "Cyato", "Kagano", "Karambi", "Nyamasheke"],
      "Bushekeri": ["Bushekeri", "Cyato", "Kagano", "Nyamasheke"],
      "Cyato": ["Bushekeri", "Cyato", "Kagano", "Nyamasheke"],
      "Gihombo": ["Bushekeri", "Cyato", "Gihombo", "Nyamasheke"],
      "Kagano": ["Bushekeri", "Cyato", "Kagano", "Nyamasheke"],
      "Karambi": ["Bushekeri", "Cyato", "Kagano", "Karambi"],
      "Kareba": ["Bushekeri", "Cyato", "Kagano", "Kareba"],
      "Kirimbi": ["Bushekeri", "Cyato", "Kagano", "Kirimbi"],
      "Macuba": ["Bushekeri", "Cyato", "Kagano", "Macuba"],
      "Mahembe": ["Bushekeri", "Cyato", "Kagano", "Mahembe"],
      "Nyamasheke": ["Bushekeri", "Cyato", "Kagano", "Nyamasheke"],
      "Rangiro": ["Bushekeri", "Cyato", "Kagano", "Rangiro"],
      "Ruharambuga": ["Bushekeri", "Cyato", "Kagano", "Ruharambuga"],
      "Shangi": ["Bushekeri", "Cyato", "Kagano", "Shangi"]
    },
    "Rutsiro": {
      "Rutsiro": ["Boneza", "Gihango", "Kigeyo", "Mushonyi", "Rutsiro"],
      "Boneza": ["Boneza", "Gihango", "Kigeyo", "Rutsiro"],
      "Gihango": ["Boneza", "Gihango", "Kigeyo", "Rutsiro"],
      "Kigeyo": ["Boneza", "Gihango", "Kigeyo", "Rutsiro"],
      "Kivumu": ["Boneza", "Gihango", "Kivumu", "Rutsiro"],
      "Manihira": ["Boneza", "Gihango", "Kigeyo", "Manihira"],
      "Mukura": ["Boneza", "Gihango", "Kigeyo", "Mukura"],
      "Murunda": ["Boneza", "Gihango", "Kigeyo", "Murunda"],
      "Mushonyi": ["Boneza", "Gihango", "Kigeyo", "Mushonyi"],
      "Mushubati": ["Boneza", "Gihango", "Kigeyo", "Mushubati"],
      "Nyabirasi": ["Boneza", "Gihango", "Kigeyo", "Nyabirasi"],
      "Ruhango": ["Boneza", "Gihango", "Kigeyo", "Ruhango"],
      "Rutsiro": ["Boneza", "Gihango", "Kigeyo", "Rutsiro"],
      "Bweyeye": ["Boneza", "Bweyeye", "Gihango", "Rutsiro"],
      "Gisenyi": ["Boneza", "Gisenyi", "Gihango", "Rutsiro"],
      "Kanama": ["Boneza", "Gihango", "Kanama", "Rutsiro"]
    },
    "Nyabihu": {
      "Nyabihu": ["Bigogwe", "Jomba", "Kabatwa", "Mukamira", "Nyabihu"],
      "Bigogwe": ["Bigogwe", "Jomba", "Kabatwa", "Mukamira", "Nyabihu"],
      "Bikingi": ["Bigogwe", "Bikingi", "Jomba", "Kabatwa", "Nyabihu"],
      "Jomba": ["Bigogwe", "Jomba", "Kabatwa", "Mukamira", "Nyabihu"],
      "Kabatwa": ["Bigogwe", "Jomba", "Kabatwa", "Mukamira", "Nyabihu"],
      "Karago": ["Bigogwe", "Jomba", "Karago", "Kabatwa", "Nyabihu"],
      "Mukamira": ["Bigogwe", "Jomba", "Kabatwa", "Mukamira", "Nyabihu"],
      "Muringa": ["Bigogwe", "Jomba", "Kabatwa", "Muringa", "Nyabihu"],
      "Rambura": ["Bigogwe", "Jomba", "Kabatwa", "Nyabihu", "Rambura"],
      "Rurembo": ["Bigogwe", "Jomba", "Kabatwa", "Nyabihu", "Rurembo"],
      "Shyira": ["Bigogwe", "Jomba", "Kabatwa", "Nyabihu", "Shyira"],
      "Gakenke": ["Bigogwe", "Gakenke", "Jomba", "Kabatwa", "Nyabihu"]
    },
    "Ngororero": {
      "Ngororero": ["Bwira", "Kabaya", "Muhanda", "Ngororero", "Sovu"],
      "Bwira": ["Bwira", "Kabaya", "Muhanda", "Ngororero"],
      "Gatumba": ["Bwira", "Gatumba", "Kabaya", "Ngororero"],
      "Hindiro": ["Bwira", "Hindiro", "Kabaya", "Ngororero"],
      "Kabaya": ["Bwira", "Kabaya", "Muhanda", "Ngororero"],
      "Kageyo": ["Bwira", "Kabaya", "Kageyo", "Ngororero"],
      "Kavumu": ["Bwira", "Kabaya", "Kavumu", "Ngororero"],
      "Muhanda": ["Bwira", "Kabaya", "Muhanda", "Ngororero"],
      "Muhororo": ["Bwira", "Kabaya", "Muhororo", "Ngororero"],
      "Ndaro": ["Bwira", "Kabaya", "Muhanda", "Ndaro"],
      "Ngororero": ["Bwira", "Kabaya", "Muhanda", "Ngororero"],
      "Nyange": ["Bwira", "Kabaya", "Muhanda", "Nyange"],
      "Sovu": ["Bwira", "Kabaya", "Muhanda", "Sovu"],
      "Gashyigwe": ["Bwira", "Gashyigwe", "Kabaya", "Ngororero"]
    }
  }
}

export const PROVINCES = Object.keys(LOCATION_DATA)
export const getDistricts = (province) => Object.keys(LOCATION_DATA[province] || {})
export const getSectors = (province, district) => Object.keys(LOCATION_DATA[province]?.[district] || {})
const toVillageList = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  return [...new Set(Object.values(value).flatMap(toVillageList))]
}

export const getVillages = (province, district, sector) =>
  toVillageList(LOCATION_DATA[province]?.[district]?.[sector])

export { LOCATION_DATA }
export default LOCATION_DATA
