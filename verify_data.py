import urllib.request
import re

print("🚀 Starting Python Verification Script (SkySports Scraper)...")

URLS = {
    'PL': 'https://www.bbc.com/sport/football/premier-league/table',
    'ELC': 'https://www.bbc.com/sport/football/championship/table'
}

def fetch_table(league_code):
    url = URLS[league_code]
    print(f"📡 Fetching {league_code} from {url}...")
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
        print(f"✅ Downloaded {len(html)} bytes.")
        
        # BBC uses valid JSON embedded in script tags sometimes, or simple table
        # Let's try to find "Manchester United" and surrounding text to see the rank
        
        # Naive approach: find team name and look backwards for the rank number
        print(f"   Searching for key teams in {league_code}...")
        
        teams_to_check = {
            'PL': ['Manchester United', 'Newcastle United', 'Liverpool'],
            'ELC': ['Leicester', 'Watford', 'Sheffield United']
        }
        
        results = {}
        for team in teams_to_check.get(league_code, []):
            if team in html:
                # Try to find position. In BBC HTML, position is often in a cell before the team name
                # regex: <td ...>7</td> ... <span ...>Manchester United</span>
                # It's hard to regex raw HTML reliably without knowing exact structure
                print(f"   ✅ Found '{team}' in raw HTML.")
                results[team] = "Found"
            else:
                print(f"   ❌ '{team}' NOT found in raw HTML. (Maybe dynamic render?)")

        return results

    except Exception as e:
        print(f"❌ Error: {e}")
        return {}

# Verify PL
pl_teams = fetch_table('PL')
print("\n")

# Verify ELC
elc_teams = fetch_table('ELC')
print("\n")

print("🔍 VERIFICATION SUMMARY:")
mu_pos = next((pos for name, pos in pl_teams.items() if "Man Utd" in name or "Manchester United" in name), "???")
new_pos = next((pos for name, pos in pl_teams.items() if "Newcastle" in name), "???")
lei_pos = next((pos for name, pos in elc_teams.items() if "Leicester" in name), "???")
wat_pos = next((pos for name, pos in elc_teams.items() if "Watford" in name), "???")

print(f"Manchester United: #{mu_pos}")
print(f"Newcastle United:  #{new_pos}")
print(f"Leicester City:    #{lei_pos}")
print(f"Watford:           #{wat_pos}")

print("\nFinished.")
