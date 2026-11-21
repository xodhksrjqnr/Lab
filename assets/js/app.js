
const treeContainer = document.getElementById("treeContainer");
const visualGrid = document.getElementById("visualGrid");
const treeSearch = document.getElementById("treeSearch");

let treeData = null;
let allPages = [];
let activePath = null;


// 트리 데이터에서 페이지 추출
function collectPages(node, result = []) {
    if (!node) return result;

    if (node.type === "page") {
        result.push(node);
    }

    (node.children || []).forEach(child => {
        collectPages(child, result);
    });

    return result;
}


// 페이지 URL 생성
function getPageUrl(path) {
    return "./" + path;
}


// 트리 렌더링
function renderTree(nodes, parentElement, keyword = "") {
    const list = document.createElement("ul");
    list.className = "tree-list";

    nodes.forEach(node => {
        const children = node.children || [];

        const isPage = node.type === "page";
        const hasChildren = children.length > 0;

        const matches = !keyword ||
            node.name.toLowerCase().includes(keyword) ||
            (node.title || "").toLowerCase().includes(keyword);

        const matchingChildren = children.filter(child =>
            matchesNode(child, keyword)
        );

        if (keyword && !matches && matchingChildren.length === 0) {
            return;
        }

        const item = document.createElement("li");
        item.className = "tree-item";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "tree-node";

        if (activePath && node.path === activePath) {
            button.classList.add("active");
        }

        const arrow = document.createElement("span");
        arrow.className = "tree-arrow";
        arrow.textContent = hasChildren ? "▾" : "";

        const icon = document.createElement("span");
        icon.className = "tree-icon";
        icon.textContent = isPage ? "📄" : "📁";

        const label = document.createElement("span");
        label.textContent = node.title || node.name;

        button.append(arrow, icon, label);
        item.appendChild(button);

        if (isPage) {
            button.addEventListener("click", () => {
                location.href = getPageUrl(node.path);
            });
        } else if (hasChildren) {
            const childList = renderTree(
                matchingChildren,
                item,
                keyword
            );

            if (keyword) {
                arrow.textContent = "▾";
            } else {
                childList.classList.add("collapsed");
                arrow.textContent = "▸";
            }

            button.addEventListener("click", () => {
                childList.classList.toggle("collapsed");

                arrow.textContent =
                    childList.classList.contains("collapsed")
                        ? "▸"
                        : "▾";
            });

            item.appendChild(childList);
        }

        list.appendChild(item);
    });

    parentElement.appendChild(list);
    return list;
}


// 검색 조건에 해당하는 노드 확인
function matchesNode(node, keyword) {
    if (!keyword) return true;

    const selfMatches =
        node.name.toLowerCase().includes(keyword) ||
        (node.title || "").toLowerCase().includes(keyword);

    const childMatches = (node.children || []).some(child =>
        matchesNode(child, keyword)
    );

    return selfMatches || childMatches;
}


// 트리 화면 갱신
function updateTree(keyword = "") {
    treeContainer.innerHTML = "";

    renderTree(
        treeData.children || [],
        treeContainer,
        keyword.toLowerCase().trim()
    );
}


// 시각화 카드 렌더링
function renderCards(pages, keyword = "") {
    const filtered = pages.filter(page => {
        const text = [
            page.title,
            page.description,
            page.name
        ].join(" ").toLowerCase();

        return text.includes(keyword.toLowerCase().trim());
    });

    visualGrid.innerHTML = "";

    if (filtered.length === 0) {
        visualGrid.innerHTML = `
            <div class="empty-state">
                검색 결과가 없습니다.
            </div>
        `;
    } else {
        filtered.forEach(page => {
            const card = document.createElement("a");

            card.className = "visual-card";
            card.href = getPageUrl(page.path);

            const icon = document.createElement("div");
            icon.className = "visual-card-icon";
            icon.textContent = getIcon(page.icon);

            const title = document.createElement("h4");
            title.textContent = page.title || page.name;

            const description = document.createElement("p");
            description.textContent =
                page.description || "등록된 설명이 없습니다.";

            const path = document.createElement("div");
            path.className = "visual-card-path";
            path.textContent = page.path;

            card.append(icon, title, description, path);
            visualGrid.appendChild(card);
        });
    }

    document.getElementById("visibleCount").textContent =
        `${filtered.length} items`;
}


// 아이콘 매핑
function getIcon(icon) {
    const icons = {
        "user-plus": "👤",
        "database": "🗄️",
        "code": "💻",
        "file-code": "📄",
        "network": "🌐",
        "shield": "🛡️",
        "workflow": "⚙️",
        "server": "🖥️",
        "layers": "📚"
    };

    return icons[icon] || "📄";
}


// 통계 업데이트
function updateSummary() {
    const categories = treeData.children || [];

    document.getElementById("totalVisuals").textContent =
        allPages.length;

    document.getElementById("totalCategories").textContent =
        categories.length;

    document.getElementById("pageCount").textContent =
        allPages.length;
}


// 데이터 로딩
async function init() {
    try {
        const response = await fetch("./data/tree.json", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        treeData = await response.json();

        allPages = collectPages(treeData);

        updateSummary();
        updateTree();
        renderCards(allPages);

    } catch (error) {
        console.error("Tree loading failed:", error);

        treeContainer.innerHTML = `
            <div class="empty-tree">
                목록을 불러오지 못했습니다.
            </div>
        `;

        visualGrid.innerHTML = `
            <div class="empty-state">
                시각화 목록을 불러오지 못했습니다.<br>
                GitHub Actions 실행 및 data/tree.json 배포 여부를 확인해 주세요.
            </div>
        `;
    }
}


// 검색 이벤트
treeSearch.addEventListener("input", event => {
    const keyword = event.target.value;

    updateTree(keyword);
    renderCards(allPages, keyword);
});


// 실행
init();
