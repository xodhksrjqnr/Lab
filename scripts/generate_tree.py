
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VISUALS_DIR = ROOT / "visuals"
OUTPUT_FILE = ROOT / "data" / "tree.json"


def read_config(folder):
    config_file = folder / "config.json"

    if not config_file.exists():
        return {}

    try:
        return json.loads(config_file.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        raise ValueError(
            f"Invalid config.json: {config_file}"
        ) from error


def build_tree(folder):
    config = read_config(folder)

    children = []

    # 하위 폴더 탐색
    directories = sorted(
        [
            item for item in folder.iterdir()
            if item.is_dir() and not item.name.startswith(".")
        ],
        key=lambda item: item.name.lower()
    )

    for directory in directories:
        child = build_tree(directory)

        if child:
            children.append(child)

    # index.html이 있는 폴더만 시각화 페이지로 등록
    has_page = (folder / "index.html").is_file()

    if not has_page and not children:
        return None

    relative_path = folder.relative_to(ROOT).as_posix()

    node = {
        "name": folder.name,
        "type": "page" if has_page else "folder",
        "path": relative_path + "/" if has_page else None,
        "children": children
    }

    if has_page:
        node["title"] = config.get("title", folder.name)
        node["description"] = config.get("description", "")
        node["icon"] = config.get("icon", "file-code")
        node["order"] = config.get("order", 999)

    # 폴더 자체가 페이지이면서 하위 폴더도 있으면
    # 페이지와 하위 항목을 모두 유지
    if not has_page:
        node.pop("path")

    return node


def main():
    if not VISUALS_DIR.exists():
        raise FileNotFoundError("visuals directory not found")

    tree = build_tree(VISUALS_DIR)

    result = {
        "name": "root",
        "type": "root",
        "children": tree["children"] if tree else []
    }

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    OUTPUT_FILE.write_text(
        json.dumps(
            result,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )

    print(f"Tree generated: {OUTPUT_FILE}")
    print(f"Categories: {len(result['children'])}")


if __name__ == "__main__":
    main()
