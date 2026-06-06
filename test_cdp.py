import json, time, subprocess, sys

subprocess.run([sys.executable, "-m", "pip", "install", "websocket-client", "-q"],
               capture_output=True)
import websocket

TAB_ID = "D685517DBA9A3E02FB0D9F2EC7879100"
ws_url = f"ws://localhost:9222/devtools/page/{TAB_ID}"
msg_id = [1]

ws = websocket.create_connection(ws_url, timeout=10)

def send(method, params=None):
    cmd = {"id": msg_id[0], "method": method, "params": params or {}}
    msg_id[0] += 1
    ws.send(json.dumps(cmd))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == cmd["id"]:
            return r.get("result", {})

time.sleep(1)

# TEST 1: Can JS fetch a VTT file?
print("=== TEST 1: Fetch VTT ===")
r1 = send("Runtime.evaluate", {
    "expression": """(async()=>{
  try{const r=await fetch('Субтитры/Видео 1_ru.vtt');
  const t=await r.text();
  return{ok:r.ok,status:r.status,len:t.length,first80:t.substring(0,80)};}
  catch(e){return{error:e.message};}})()""",
    "awaitPromise": True, "returnByValue": True
})
print(json.dumps(r1.get("result", {}).get("value", r1), ensure_ascii=False, indent=2))

# TEST 2: Click video 1 card, check player opens
print("\n=== TEST 2: Click Video 1 ===")
send("Runtime.evaluate", {"expression": "document.querySelector('.work-card').click();"})
time.sleep(3)

r2 = send("Runtime.evaluate", {
    "expression": """({
  modal: document.getElementById('videoModal').classList.contains('active'),
  videoSrc: document.getElementById('mainVideo').src
})""",
    "returnByValue": True
})
print(json.dumps(r2.get("result", {}).get("value", r2), ensure_ascii=False, indent=2))

# TEST 3: Click Russian subtitle option
print("\n=== TEST 3: Select Russian subtitles ===")
send("Runtime.evaluate", {
    "expression": "document.querySelector('.sub-option[data-lang=\"ru\"]').click();"
})
time.sleep(2)

r3 = send("Runtime.evaluate", {
    "expression": """({
  subLang: currentSubLang,
  cuesLoaded: currentSubCues.length,
  displayHtml: document.getElementById('subtitleDisplay').innerHTML.substring(0,120)
})""",
    "returnByValue": True
})
print(json.dumps(r3.get("result", {}).get("value", r3), ensure_ascii=False, indent=2))

# TEST 4: Seek to 5s and check subtitle displayed
print("\n=== TEST 4: Seek to 5s, check subtitle shows ===")
send("Runtime.evaluate", {
    "expression": "document.getElementById('mainVideo').currentTime = 5;"
})
time.sleep(1)
r4 = send("Runtime.evaluate", {
    "expression": "document.getElementById('subtitleDisplay').innerHTML",
    "returnByValue": True
})
print("SubtitleDisplay:", r4.get("result", {}).get("value", ""))

# TEST 5: Check all 80 VTT files - count cues
print("\n=== TEST 5: All 80 VTT files (cue count) ===")
r5 = send("Runtime.evaluate", {
    "expression": """(async()=>{
  const langs=['ru','en','be','uk','kk','de','fr','zh','ko','ja'];
  const res={};
  for(let n=1;n<=8;n++){
    res[n]={};
    for(const l of langs){
      try{
        const r=await fetch('Субтитры/Видео '+n+'_'+l+'.vtt');
        const t=await r.text();
        res[n][l]=(t.match(/-->/g)||[]).length;
      }catch(e){res[n][l]='ERR';}
    }
  }
  return res;})()""",
    "awaitPromise": True, "returnByValue": True, "timeout": 30000
})
data = r5.get("result", {}).get("value", {})
for n, langs in data.items():
    ok = sum(1 for v in langs.values() if isinstance(v, int) and v > 0)
    bad = {l: v for l, v in langs.items() if not isinstance(v, int) or v == 0}
    print(f"  Video {n}: {ok}/10" + (f"  BAD:{bad}" if bad else " OK"))

ws.close()
