#!/usr/bin/env python3
"""
Convert Riutiz Card Library Excel file to JSON for the game.

Usage:
  python convert_cards.py Riutiz_Card_Library.xlsx cards.json

Requirements:
  pip install pandas openpyxl
"""

import sys
import pandas as pd
import json

def safe_int(val):
    if pd.isna(val):
        return None
    try:
        return int(val)
    except:
        return str(val)

def safe_str(val):
    if pd.isna(val):
        return None
    return str(val).strip()

def convert(input_file, output_file='cards.json'):
    print(f"Reading {input_file}...")
    df = pd.read_excel(input_file, sheet_name='Card Library')
    
    cards = []
    for idx, row in df.iterrows():
        if pd.isna(row['Card Name']):
            continue
        
        card = {
            'id': idx + 1,
            'name': safe_str(row['Card Name']),
            'type': safe_str(row['Type']),
            'subTypes': safe_str(row.get('Sub-Types')),
            'cost': safe_str(row.get('Cost')),
            'dice': safe_str(row.get('Dice')),
            'ad': safe_int(row.get('AD (Original)')),
            'endurance': safe_int(row.get('Endurance')),
            'ability': safe_str(row.get('Ability')),
            'rarity': safe_str(row.get('Rarity')) or 'C',
            'resourceAbility': safe_str(row.get('Resource Ability'))
        }
        cards.append(card)
    
    print(f"Found {len(cards)} cards")
    
    # Count by type
    types = {}
    for c in cards:
        t = c['type']
        types[t] = types.get(t, 0) + 1
    print("Card types:", types)
    
    # Save
    with open(output_file, 'w') as f:
        json.dump(cards, f, indent=2)
    
    print(f"Saved to {output_file}")
    print(f"File size: {len(json.dumps(cards))} bytes")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python convert_cards.py <excel_file> [output.json]")
        print("Example: python convert_cards.py Riutiz_Card_Library_v15.xlsx cards.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'cards.json'
    convert(input_file, output_file)
