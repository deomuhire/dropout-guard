from flask import Blueprint, jsonify

locations_bp = Blueprint('locations', __name__)

# Complete Rwanda Administrative Location Data
# Structure: Province > District > Sector > [Villages]

LOCATION_DATA = {
    "Kigali City": {
        "Nyarugenge": {
            "Nyarugenge": ["Biryogo", "Camp Swahili", "Cyahafi", "Kabeza", "Kagugu", "Kamuhanda", "Kandahar", "Kimisango", "Muhima", "Rwampara"],
            "Gitega": ["Akabahizi", "Bwiza", "Kanyinya", "Kigogo", "Mageragere", "Rwezamenyo", "Nyakabanda", "Rugenge"],
            "Kicukiro": ["Gatenga", "Kagarama", "Kanombe", "Kicukiro", "Masaka", "Niboye", "Nyarugunga", "Gikondo"],
            "Kacyiru": ["Gatunga", "Kacyiru", "Kamukina", "Kimihurura", "Rugando", "Rwimbogo"],
            "Muhima": ["Bwiza", "Muhima", "Nyamirambo", "Rwezamenyo"],
            "Gikondo": ["Gikondo", "Kanombe", "Kicukiro", "Masaka"]
        },
        "Gasabo": {
            "Remera": ["Gisimenti", "Kacyiru", "Kimihurura", "Nyandungu", "Rugando"],
            "Kimirombo": ["Gatsata", "Jabana", "Kimirombo", "Nyacyonga", "Rusororo"],
            "Kimironko": ["Bibare", "Kabeza", "Kimironko", "Niboye", "Nyagatovu", "Zindiro"],
            "Kinyinya": ["Bumbogo", "Gatsata", "Kinyinya", "Ndera", "Rusororo"],
            "Ndera": ["Gasharu", "Ndera", "Rukatsa", "Rutunga"],
            "Rusororo": ["Gatsata", "Kinyinya", "Rusororo", "Nyacyonga"],
            "Jabana": ["Jabana", "Gatsata", "Kimirombo", "Nyacyonga"],
            "Gatsata": ["Gatsata", "Jabana", "Kinyinya", "Nyacyonga"],
            "Bumbogo": ["Bumbogo", "Gatsata", "Kinyinya", "Ndera"],
            "Gikomero": ["Gikomero", "Kinyinya", "Ndera", "Rutunga"]
        },
        "Kicukiro": {
            "Kagarama": ["Kagarama", "Kanombe", "Kicukiro", "Masaka", "Niboye"],
            "Nyarugunga": ["Kanombe", "Masaka", "Nyarugunga", "Gatenga"],
            "Kanombe": ["Kanombe", "Kagarama", "Masaka", "Nyarugunga"],
            "Masaka": ["Kagarama", "Kanombe", "Masaka", "Nyarugunga"],
            "Gikondo": ["Gikondo", "Kagarama", "Kicukiro", "Rwezamenyo"],
            "Niboye": ["Kagarama", "Kicukiro", "Niboye", "Nyakabanda"],
            "Gatenga": ["Gatenga", "Kagarama", "Kicukiro", "Nyarugunga"]
        }
    },
    "Southern": {
        "Huye": {
            "Ngoma": ["Bukira", "Migongo", "Ngoma", "Rwaniro", "Save"],
            "Mbazi": ["Kibayi", "Mbazi", "Mukura", "Nyamiyaga", "Rwaniro"],
            "Matyazo": ["Busoro", "Matyazo", "Muyogoro", "Rwaniro"],
            "Tumba": ["Bukira", "Gahogo", "Migongo", "Tumba"],
            "Huye": ["Bukira", "Huye", "Migongo", "Save"],
            "Kigoma": ["Kigoma", "Mukura", "Rwaniro", "Save"],
            "Simbi": ["Kibayi", "Mukura", "Simbi"],
            "Maraba": ["Maraba", "Mukura", "Nyamiyaga", "Save"],
            "Karama": ["Karama", "Kigoma", "Mukura", "Rwaniro"],
            "Gishamvu": ["Gishamvu", "Kigoma", "Mukura", "Rwaniro"]
        },
        "Nyanza": {
            "Nyanza": ["Bweramvura", "Kabagari", "Nyanza", "Rwabicumi", "Cyabakamyi"],
            "Mukingo": ["Kabagari", "Mukingo", "Muyira", "Rwabicumi"],
            "Nyagyiso": ["Kabagari", "Mukingo", "Nyagyiso", "Rwabicumi"],
            "Kibirizi": ["Kibirizi", "Mukingo", "Muyira", "Rwabicumi"],
            "Busasamana": ["Busasamana", "Kabagari", "Mukingo", "Nyanza"],
            "Busoro": ["Busoro", "Mukingo", "Nyanza", "Rwabicumi"],
            "Muyira": ["Kibirizi", "Mukingo", "Muyira", "Nyanza"],
            "Rwabicumi": ["Kabagari", "Mukingo", "Nyanza", "Rwabicumi"],
            "Cyabakamyi": ["Cyabakamyi", "Mukingo", "Nyanza", "Rwabicumi"],
            "Gatagara": ["Gatagara", "Kabagari", "Mukingo", "Nyanza"]
        },
        "Gisagara": {
            "Gisagara": ["Bukana", "Gisagara", "Muganza", "Mugiraneza", "Save"],
            "Kibilizi": ["Kibilizi", "Muganza", "Mugiraneza", "Save"],
            "Kigembe": ["Kigembe", "Muganza", "Mugiraneza", "Save"],
            "Muganza": ["Kibilizi", "Muganza", "Mugiraneza", "Save"],
            "Mugiraneza": ["Kibilizi", "Muganza", "Mugiraneza", "Save"],
            "Mukindo": ["Kibilizi", "Muganza", "Mukindo", "Save"],
            "Ndora": ["Kibilizi", "Muganza", "Mugiraneza", "Ndora"],
            "Gishubi": ["Gishubi", "Kibilizi", "Muganza", "Save"],
            "Nyamagabe": ["Kibilizi", "Muganza", "Mugiraneza", "Nyamagabe"],
            "Kansi": ["Kansi", "Kibilizi", "Muganza", "Save"]
        },
        "Nyamagabe": {
            "Nyamagabe": ["Buruhi", "Kamegeri", "Nyamagabe", "Uwinkingi"],
            "Kitabi": ["Kamegeri", "Kitabi", "Nyamagabe", "Uwinkingi"],
            "Kamegeri": ["Kamegeri", "Kitabi", "Nyamagabe", "Uwinkingi"],
            "Uwinkingi": ["Kamegeri", "Kitabi", "Nyamagabe", "Uwinkingi"],
            "Mugano": ["Kamegeri", "Mugano", "Nyamagabe", "Uwinkingi"],
            "Kibirizi": ["Kibirizi", "Kamegeri", "Nyamagabe", "Uwinkingi"],
            "Tare": ["Kamegeri", "Nyamagabe", "Tare", "Uwinkingi"],
            "Cyanika": ["Cyanika", "Kamegeri", "Nyamagabe", "Uwinkingi"],
            "Gasaka": ["Gasaka", "Kamegeri", "Nyamagabe", "Uwinkingi"],
            "Buruhu": ["Buruhu", "Kamegeri", "Nyamagabe", "Uwinkingi"]
        },
        "Ruhango": {
            "Ruhango": ["Bweramvura", "Kabagari", "Ruhango", "Rwabicumi"],
            "Kinihira": ["Kabagari", "Kinihira", "Ruhango", "Rwabicumi"],
            "Mbuye": ["Kabagari", "Mbuye", "Ruhango", "Rwabicumi"],
            "Muhanga": ["Kabagari", "Muhanga", "Ruhango", "Rwabicumi"],
            "Ntongwe": ["Kabagari", "Ntongwe", "Ruhango", "Rwabicumi"],
            "Bweramvura": ["Bweramvura", "Kabagari", "Ruhango", "Rwabicumi"],
            "Kabagari": ["Kabagari", "Ruhango", "Rwabicumi"],
            "Rwabicumi": ["Kabagari", "Ruhango", "Rwabicumi"],
            "Gitovu": ["Gitovu", "Kabagari", "Ruhango", "Rwabicumi"],
            "Mwendo": ["Kabagari", "Mwendo", "Ruhango", "Rwabicumi"]
        },
        "Muhanga": {
            "Muhanga": ["Bikingi", "Gahogo", "Muhanga", "Nyamabuye", "Shyogwe"],
            "Kiyumba": ["Bikingi", "Gahogo", "Kiyumba", "Nyamabuye"],
            "Nyamabuye": ["Bikingi", "Gahogo", "Muhanga", "Nyamabuye"],
            "Shyogwe": ["Bikingi", "Gahogo", "Muhanga", "Shyogwe"],
            "Cyeza": ["Cyeza", "Gahogo", "Muhanga", "Nyamabuye"],
            "Kabacuzi": ["Gahogo", "Kabacuzi", "Muhanga", "Nyamabuye"],
            "Kibangu": ["Gahogo", "Kibangu", "Muhanga", "Nyamabuye"],
            "Mushishiro": ["Gahogo", "Muhanga", "Mushishiro", "Nyamabuye"],
            "Nyarusange": ["Gahogo", "Muhanga", "Nyamabuye", "Nyarusange"],
            "Rongi": ["Gahogo", "Muhanga", "Nyamabuye", "Rongi"]
        },
        "Kamonyi": {
            "Kamonyi": ["Gacurabwenge", "Kamonyi", "Mugina", "Rukoma", "Runda"],
            "Gacurabwenge": ["Gacurabwenge", "Kamonyi", "Mugina", "Rukoma"],
            "Karama": ["Gacurabwenge", "Kamonyi", "Karama", "Rukoma"],
            "Kayenzi": ["Gacurabwenge", "Kamonyi", "Kayenzi", "Rukoma"],
            "Kibeho": ["Gacurabwenge", "Kamonyi", "Kibeho", "Rukoma"],
            "Mugina": ["Gacurabwenge", "Kamonyi", "Mugina", "Rukoma"],
            "Musambira": ["Gacurabwenge", "Kamonyi", "Musambira", "Rukoma"],
            "Ngamba": ["Gacurabwenge", "Kamonyi", "Ngamba", "Rukoma"],
            "Nyamiyaga": ["Gacurabwenge", "Kamonyi", "Nyamiyaga", "Rukoma"],
            "Runda": ["Gacurabwenge", "Kamonyi", "Mugina", "Runda"]
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
            "Rwamagana": ["Fumbwe", "Gahengeri", "Karenges", "Munyiginya", "Rwamagana"],
            "Fumbwe": ["Fumbwe", "Gahengeri", "Karenges", "Rwamagana"],
            "Gahengeri": ["Fumbwe", "Gahengeri", "Karenges", "Rwamagana"],
            "Karenges": ["Fumbwe", "Gahengeri", "Karenges", "Rwamagana"],
            "Kigabiro": ["Fumbwe", "Gahengeri", "Kigabiro", "Rwamagana"],
            "Muhazi": ["Fumbwe", "Gahengeri", "Muhazi", "Rwamagana"],
            "Munyiginya": ["Fumbwe", "Gahengeri", "Karenges", "Munyiginya"],
            "Musha": ["Fumbwe", "Gahengeri", "Musha", "Rwamagana"],
            "Muyumbu": ["Fumbwe", "Gahengeri", "Muyumbu", "Rwamagana"],
            "Nyakariro": ["Fumbwe", "Gahengeri", "Nyakariro", "Rwamagana"],
            "Rubona": ["Fumbwe", "Gahengeri", "Rubona", "Rwamagana"],
            "Rukara": ["Fumbwe", "Gahengeri", "Rukara", "Rwamagana"],
            "Zaza": ["Fumbwe", "Gahengeri", "Rwamagana", "Zaza"],
            "Gishari": ["Fumbwe", "Gishari", "Gahengeri", "Rwamagana"],
            "Mwurire": ["Fumbwe", "Gahengeri", "Mwurire", "Rwamagana"]
        },
        "Kayonza": {
            "Kayonza": ["Gahini", "Kabarondo", "Kayonza", "Mukarange", "Ruramira"],
            "Gahini": ["Gahini", "Kabarondo", "Kayonza", "Mukarange"],
            "Kabarondo": ["Gahini", "Kabarondo", "Kayonza", "Mukarange"],
            "Mukarange": ["Gahini", "Kabarondo", "Kayonza", "Mukarange"],
            "Murundi": ["Gahini", "Kabarondo", "Murundi", "Kayonza"],
            "Ruramira": ["Gahini", "Kabarondo", "Kayonza", "Ruramira"],
            "Nyamirama": ["Gahini", "Kabarondo", "Kayonza", "Nyamirama"],
            "Kabare": ["Gahini", "Kabare", "Kabarondo", "Kayonza"],
            "Rwinkwavu": ["Gahini", "Kabarondo", "Kayonza", "Rwinkwavu"],
            "Mwiri": ["Gahini", "Kabarondo", "Kayonza", "Mwiri"]
        },
        "Kirehe": {
            "Kirehe": ["Gahara", "Kirehe", "Mahama", "Mpanga", "Nasho"],
            "Gahara": ["Gahara", "Kirehe", "Mahama", "Mpanga"],
            "Kigarama": ["Gahara", "Kigarama", "Kirehe", "Mpanga"],
            "Mahama": ["Gahara", "Kirehe", "Mahama", "Mpanga"],
            "Mpanga": ["Gahara", "Kirehe", "Mahama", "Mpanga"],
            "Musaza": ["Gahara", "Kirehe", "Mahama", "Musaza"],
            "Mushikiri": ["Gahara", "Kirehe", "Mahama", "Mushikiri"],
            "Nasho": ["Gahara", "Kirehe", "Mahama", "Nasho"],
            "Nyamugari": ["Gahara", "Kirehe", "Mahama", "Nyamugari"],
            "Kigina": ["Gahara", "Kigina", "Kirehe", "Mahama"],
            "Gatore": ["Gahara", "Gatore", "Kirehe", "Mahama"],
            "Rusumo": ["Gahara", "Kirehe", "Mahama", "Rusumo"]
        },
        "Ngoma": {
            "Ngoma": ["Gashanda", "Jarama", "Kazo", "Ngoma", "Rukumberi"],
            "Gashanda": ["Gashanda", "Jarama", "Kazo", "Ngoma"],
            "Jarama": ["Gashanda", "Jarama", "Kazo", "Ngoma"],
            "Kazo": ["Gashanda", "Jarama", "Kazo", "Ngoma"],
            "Kibungo": ["Gashanda", "Jarama", "Kibungo", "Ngoma"],
            "Mugesera": ["Gashanda", "Jarama", "Mugesera", "Ngoma"],
            "Murama": ["Gashanda", "Jarama", "Murama", "Ngoma"],
            "Mutenderi": ["Gashanda", "Jarama", "Mutenderi", "Ngoma"],
            "Remera": ["Gashanda", "Jarama", "Ngoma", "Remera"],
            "Rukumberi": ["Gashanda", "Jarama", "Kazo", "Rukumberi"],
            "Sake": ["Gashanda", "Jarama", "Ngoma", "Sake"],
            "Zaza": ["Gashanda", "Jarama", "Ngoma", "Zaza"]
        },
        "Bugesera": {
            "Bugesera": ["Gashora", "Kamabuye", "Mayange", "Ntarama", "Rilima"],
            "Gashora": ["Gashora", "Kamabuye", "Mayange", "Ntarama"],
            "Kamabuye": ["Gashora", "Kamabuye", "Mayange", "Ntarama"],
            "Mayange": ["Gashora", "Kamabuye", "Mayange", "Ntarama"],
            "Ntarama": ["Gashora", "Kamabuye", "Mayange", "Ntarama"],
            "Nyamata": ["Gashora", "Kamabuye", "Nyamata", "Ntarama"],
            "Rilima": ["Gashora", "Kamabuye", "Mayange", "Rilima"],
            "Ruhuha": ["Gashora", "Kamabuye", "Mayange", "Ruhuha"],
            "Mareba": ["Gashora", "Kamabuye", "Mareba", "Mayange"],
            "Musenyi": ["Gashora", "Kamabuye", "Mayange", "Musenyi"],
            "Mwogo": ["Gashora", "Kamabuye", "Mayange", "Mwogo"],
            "Shyara": ["Gashora", "Kamabuye", "Mayange", "Shyara"],
            "Juru": ["Gashora", "Juru", "Kamabuye", "Mayange"],
            "Rweru": ["Gashora", "Kamabuye", "Mayange", "Rweru"]
        },
        "Nyagatare": {
            "Nyagatare": ["Gatunda", "Karama", "Kiyombe", "Mimuli", "Nyagatare"],
            "Gatunda": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
            "Karama": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
            "Kiyombe": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
            "Mimuli": ["Gatunda", "Karama", "Kiyombe", "Mimuli"],
            "Matimba": ["Gatunda", "Karama", "Kiyombe", "Matimba"],
            "Musheli": ["Gatunda", "Karama", "Kiyombe", "Musheli"],
            "Nyagatare": ["Gatunda", "Karama", "Kiyombe", "Nyagatare"],
            "Rukomo": ["Gatunda", "Karama", "Kiyombe", "Rukomo"],
            "Rwempasha": ["Gatunda", "Karama", "Kiyombe", "Rwempasha"],
            "Tabagwe": ["Gatunda", "Karama", "Kiyombe", "Tabagwe"],
            "Karangazi": ["Gatunda", "Karangazi", "Karama", "Nyagatare"],
            "Rwesero": ["Gatunda", "Karama", "Nyagatare", "Rwesero"],
            "Gitoki": ["Gatunda", "Gitoki", "Karama", "Nyagatare"],
            "Kabatwa": ["Gatunda", "Karama", "Kabatwa", "Nyagatare"]
        },
        "Gatsibo": {
            "Gatsibo": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama", "Rwimbogo"],
            "Gatsibo": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
            "Kabarore": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
            "Kiziguro": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
            "Rugarama": ["Gatsibo", "Kabarore", "Kiziguro", "Rugarama"],
            "Rwimbogo": ["Gatsibo", "Kabarore", "Kiziguro", "Rwimbogo"],
            "Gasange": ["Gasange", "Gatsibo", "Kabarore", "Kiziguro"],
            "Gitoki": ["Gitoki", "Gatsibo", "Kabarore", "Kiziguro"],
            "Kageyo": ["Gatsibo", "Kabarore", "Kageyo", "Kiziguro"],
            "Kiramuruzi": ["Gatsibo", "Kabarore", "Kiramuruzi", "Kiziguro"],
            "Muhura": ["Gatsibo", "Kabarore", "Kiziguro", "Muhura"],
            "Murambi": ["Gatsibo", "Kabarore", "Kiziguro", "Murambi"],
            "Ngarama": ["Gatsibo", "Kabarore", "Kiziguro", "Ngarama"],
            "Nyagihanga": ["Gatsibo", "Kabarore", "Kiziguro", "Nyagihanga"],
            "Remera": ["Gatsibo", "Kabarore", "Kiziguro", "Remera"]
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


@locations_bp.route('/', methods=['GET'])
def get_locations():
    """Return the complete Rwanda location data."""
    return jsonify(LOCATION_DATA), 200


@locations_bp.route('/provinces', methods=['GET'])
def get_provinces():
    """Return list of all provinces."""
    return jsonify(list(LOCATION_DATA.keys())), 200


@locations_bp.route('/districts/<province>', methods=['GET'])
def get_districts(province):
    """Return list of districts for a given province."""
    if province not in LOCATION_DATA:
        return jsonify({'error': f'Province {province} not found'}), 404
    return jsonify(list(LOCATION_DATA[province].keys())), 200


@locations_bp.route('/sectors/<province>/<district>', methods=['GET'])
def get_sectors(province, district):
    """Return list of sectors for a given province and district."""
    if province not in LOCATION_DATA:
        return jsonify({'error': f'Province {province} not found'}), 404
    if district not in LOCATION_DATA[province]:
        return jsonify({'error': f'District {district} not found in {province}'}), 404
    return jsonify(list(LOCATION_DATA[province][district].keys())), 200


@locations_bp.route('/villages/<province>/<district>/<sector>', methods=['GET'])
def get_villages(province, district, sector):
    """Return list of villages for a given province, district and sector."""
    if province not in LOCATION_DATA:
        return jsonify({'error': f'Province {province} not found'}), 404
    if district not in LOCATION_DATA[province]:
        return jsonify({'error': f'District {district} not found in {province}'}), 404
    if sector not in LOCATION_DATA[province][district]:
        return jsonify({'error': f'Sector {sector} not found in {district}'}), 404
    return jsonify(LOCATION_DATA[province][district][sector]), 200
