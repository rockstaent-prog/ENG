"""Bundle the self-contained app as a ZIP for a normal browser download."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

preview = Path(__file__).resolve().parent.parent / "preview"
html = (preview / "komorebi.html").read_bytes()
instructions = """こもれび 英語学習アプリ

「アプリを開く.html」をダブルクリックしてください。
Emmaの画面で「あいさつを聞く」を押してみてください。
声に合わせて口・頭・肩が動き、まばたきもします。
「履歴を広く」で文字を読みやすくできます。
アバターを押すと大きく表示できます。
選んだ画像は、設定画面で顔の位置や大きさを変えられます。
会話には女性の声を使います。
女性の英語音声が端末にない場合は、画面でお知らせします。
英語の学習や、Emmaとの会話も試せます。
カフェでの支払いと、復習画面が止まる不具合を修正しました。

文字の一覧が出た場合は、ファイルを右クリックして
「プログラムから開く」→「Chrome」または「Edge」を選んでください。

インストールやAPIキーの入力は不要です。
パソコン向けです。スマートフォンのファイル表示では動かない場合があります。
"""

with ZipFile(preview / "komorebi.zip", "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in [("アプリを開く.html", html), ("はじめに.txt", instructions.encode("utf-8-sig"))]:
        info = ZipInfo(name)
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, data, compresslevel=9)

with ZipFile(preview / "komorebi.zip") as archive:
    assert archive.testzip() is None, "Archive CRC verification failed"
    assert archive.namelist() == ["アプリを開く.html", "はじめに.txt"]
    assert archive.read("アプリを開く.html") == html, "Packaged app differs from the source artifact"

print(f"Saved and verified preview/komorebi.zip ({(preview / 'komorebi.zip').stat().st_size:,} bytes)")
