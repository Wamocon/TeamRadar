import json
with open(r"d:\IDEA\Projekt\TeamRadar\coverage\coverage-final.json") as f:
    data = json.load(f)
key = next(k for k in data if "appStore" in k)
print("Key:", key)
store = data[key]
print("ALL FUNCTIONS:")
for idx, hits in store["f"].items():
    fn = store["fnMap"][idx]
    tag = "UNCOVERED" if hits == 0 else "covered"
    print(tag, "Fn", idx, "hits=" + str(hits), "name=" + str(fn["name"]), "line=" + str(fn["loc"]["start"]["line"]))
print("UNCOVERED STATEMENTS:")
for idx, hits in store["s"].items():
    if hits == 0:
        sm = store["statementMap"][idx]
        print("Stmt", idx, "lines", sm["start"]["line"], "-", sm["end"]["line"])
print("UNCOVERED BRANCHES:")
for idx, vals in store["b"].items():
    bm = store["branchMap"][idx]
    for i, hits in enumerate(vals):
        if hits == 0:
            print("Branch", idx, "[" + str(i) + "]", "type=" + str(bm["type"]), "line=" + str(bm["loc"]["start"]["line"]))
