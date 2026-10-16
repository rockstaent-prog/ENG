"""Package the installable mobile web app without development tools or secrets."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
output = root / "preview" / "komorebi-mobile.zip"
source = root / "dist-mobile"
instructions = """こもれび 携帯版

【携帯で使う方へ】
このZIPは、携帯用ページを公開するためのファイルです。
ZIPを開くだけでは、iPhoneやAndroidにアプリは入りません。

公開したアプリを携帯のSafariまたはChromeで開き、
画面上の「携帯に保存」を押してください。
iPhone: 共有 → ホーム画面に追加 → 追加
Android: 保存ボタン、または右上の︙ → ホーム画面に追加

初回の保存が終わると、学習と練習会話は通信なしでも使えます。
音声とマイクは端末や通信状態によって使えない場合があります。

【公開する方へ】
「アプリ」フォルダの中身をHTTPSのサイトに配置してください。
GitHub Pagesにも配置できます。サーバーやAPIキーは不要です。
最初はEmmaの会話画面が開きます。
"""

entries = [("携帯で使うには.txt", instructions.encode("utf-8-sig"))]
entries += [("アプリ/" + file.relative_to(source).as_posix(), file.read_bytes())
            for file in sorted(source.rglob("*")) if file.is_file()]
assert any(name == "アプリ/sw.js" for name, _ in entries)
assert any(name == "アプリ/manifest.webmanifest" for name, _ in entries)
with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in entries:
        info = ZipInfo(name)
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, data, compresslevel=9)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    for name, data in entries:
        assert archive.read(name) == data
print(f"Saved and verified {output.relative_to(root)} ({output.stat().st_size:,} bytes)")
