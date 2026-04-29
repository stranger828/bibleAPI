const BIBLE_URL = "./bible_structured.json";
const ITEMS_PER_PAGE = 20;

const BOOK_ALIASES = {
    창: "창",
    창세기: "창",
    출: "출",
    출애굽기: "출",
    레: "레",
    레위기: "레",
    민: "민",
    민수기: "민",
    신: "신",
    신명기: "신",
    수: "수",
    여호수아: "수",
    삿: "삿",
    사사기: "삿",
    룻: "룻",
    룻기: "룻",
    삼상: "삼상",
    사무엘상: "삼상",
    삼하: "삼하",
    사무엘하: "삼하",
    왕상: "왕상",
    열왕기상: "왕상",
    왕하: "왕하",
    열왕기하: "왕하",
    대상: "대상",
    역대상: "대상",
    역대상기: "대상",
    역대상서: "대상",
    "역 대상": "대상",
    대하: "대하",
    역대하: "대하",
    스: "스",
    에스라: "스",
    느: "느",
    느헤미야: "느",
    에: "에",
    에스더: "에",
    욥: "욥",
    욥기: "욥",
    시: "시",
    시편: "시",
    잠: "잠",
    잠언: "잠",
    전: "전",
    전도서: "전",
    아: "아",
    아가: "아",
    사: "사",
    이사야: "사",
    렘: "렘",
    예레미야: "렘",
    애: "애",
    예레미야애가: "애",
    겔: "겔",
    에스겔: "겔",
    단: "단",
    다니엘: "단",
    호: "호",
    호세아: "호",
    욜: "욜",
    요엘: "욜",
    암: "암",
    아모스: "암",
    옵: "옵",
    오바댜: "옵",
    욘: "욘",
    요나: "욘",
    미: "미",
    미가: "미",
    나: "나",
    나훔: "나",
    합: "합",
    하박국: "합",
    습: "습",
    스바냐: "습",
    학: "학",
    학개: "학",
    슥: "슥",
    스가랴: "슥",
    말: "말",
    말라기: "말",
    마: "마",
    마태복음: "마",
    막: "막",
    마가복음: "막",
    눅: "눅",
    누가복음: "눅",
    요: "요",
    요한복음: "요",
    행: "행",
    사도행전: "행",
    롬: "롬",
    로마서: "롬",
    고전: "고전",
    고린도전서: "고전",
    고후: "고후",
    고린도후서: "고후",
    갈: "갈",
    갈라디아서: "갈",
    엡: "엡",
    에베소서: "엡",
    빌: "빌",
    빌립보서: "빌",
    골: "골",
    골로새서: "골",
    살전: "살전",
    데살로니가전서: "살전",
    살후: "살후",
    데살로니가후서: "살후",
    딤전: "딤전",
    디모데전서: "딤전",
    딤후: "딤후",
    디모데후서: "딤후",
    딛: "딛",
    디도서: "딛",
    몬: "몬",
    빌레몬서: "몬",
    히: "히",
    히브리서: "히",
    약: "약",
    야고보서: "약",
    벧전: "벧전",
    베드로전서: "벧전",
    벧후: "벧후",
    베드로후서: "벧후",
    요일: "요일",
    요한일서: "요일",
    요이: "요이",
    요한이서: "요이",
    요삼: "요삼",
    요한삼서: "요삼",
    유: "유",
    유다서: "유",
    계: "계",
    요한계시록: "계"
};

let bibleData = [];
let isDataLoaded = false;
let currentResults = [];
let currentRenderCount = 0;
let currentSearchMeta = createHomeMeta();
let copyRangeState = { start: "", end: "" };

const bibleIndex = {
    books: [],
    chaptersByBook: {},
    versesByBookChapter: {}
};

window.onload = async () => {
    disableControls(true);
    setStatus("성경 데이터 다운로드 중... (약 6MB)");

    try {
        const response = await fetch(BIBLE_URL);
        if (!response.ok) {
            throw new Error("네트워크 오류");
        }

        bibleData = await response.json();
        buildBibleIndex();
        initializeBrowseControls();
        document.addEventListener("keydown", handleGlobalKeydown);

        isDataLoaded = true;
        disableControls(false);
        setStatus(`데이터 로드 완료! (총 ${bibleData.length}절)`);
        document.getElementById("searchInput").focus();
    } catch (error) {
        console.error(error);
        setStatus("데이터 로드 실패. 새로고침 해주세요.", true);
    }
};

function disableControls(disabled) {
    document.getElementById("homeBtn").disabled = disabled;
    document.getElementById("searchBtn").disabled = disabled;
    document.getElementById("browseBtn").disabled = disabled;
    document.getElementById("bookSelect").disabled = disabled;
    document.getElementById("chapterSelect").disabled = disabled;
    document.getElementById("verseSelect").disabled = disabled;
    document.getElementById("copyChapterBtn").disabled = disabled;
    document.getElementById("copyStartVerse").disabled = disabled;
    document.getElementById("copyEndVerse").disabled = disabled;
}

function setStatus(message, isError = false) {
    const statusEl = document.getElementById("status");
    statusEl.textContent = message;
    statusEl.style.color = isError ? "red" : "";
}

function createHomeMeta() {
    return {
        mode: "home",
        isReference: false,
        keyword: "",
        label: "",
        book: null,
        chapter: null,
        verse: null,
        viewMode: "home"
    };
}

function updateChapterNavButtons() {
    const prevBtn = document.getElementById("prevChapterBtn");
    const nextBtn = document.getElementById("nextChapterBtn");
    const isChapterView = currentSearchMeta.viewMode === "chapter" && currentSearchMeta.book && currentSearchMeta.chapter;

    if (!isChapterView) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    prevBtn.disabled = !getAdjacentChapterTarget(-1);
    nextBtn.disabled = !getAdjacentChapterTarget(1);
}

function updateChapterToolbar() {
    const toolbar = document.getElementById("chapterToolbar");
    const title = document.getElementById("chapterTitle");
    const startSelect = document.getElementById("copyStartVerse");
    const endSelect = document.getElementById("copyEndVerse");
    const isChapterView = currentSearchMeta.viewMode === "chapter" && currentSearchMeta.book && currentSearchMeta.chapter;

    if (!isChapterView) {
        toolbar.classList.remove("active");
        title.textContent = "";
        setOptions(startSelect, [], "시작절");
        setOptions(endSelect, [], "끝절");
        return;
    }

    toolbar.classList.add("active");
    title.textContent = `${currentSearchMeta.book} ${currentSearchMeta.chapter}장`;

    const verses = currentResults.map(item => item.verse);
    setOptions(startSelect, verses, "시작절");
    setOptions(endSelect, verses, "끝절");

    if (!copyRangeState.start || !verses.includes(parseInt(copyRangeState.start, 10))) {
        copyRangeState.start = String(verses[0]);
    }

    if (!copyRangeState.end || !verses.includes(parseInt(copyRangeState.end, 10))) {
        copyRangeState.end = String(verses[verses.length - 1]);
    }

    if (parseInt(copyRangeState.start, 10) > parseInt(copyRangeState.end, 10)) {
        copyRangeState.end = copyRangeState.start;
    }

    startSelect.value = copyRangeState.start;
    endSelect.value = copyRangeState.end;
}

function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
}

function normalizeBookName(book) {
    return book.replace(/\s+/g, "");
}

function buildBibleIndex() {
    const seenBooks = new Set();

    for (const verse of bibleData) {
        const { book, chapter, verse: verseNumber } = verse;

        if (!seenBooks.has(book)) {
            bibleIndex.books.push(book);
            seenBooks.add(book);
        }

        if (!bibleIndex.chaptersByBook[book]) {
            bibleIndex.chaptersByBook[book] = new Set();
        }
        bibleIndex.chaptersByBook[book].add(chapter);

        if (!bibleIndex.versesByBookChapter[book]) {
            bibleIndex.versesByBookChapter[book] = {};
        }
        if (!bibleIndex.versesByBookChapter[book][chapter]) {
            bibleIndex.versesByBookChapter[book][chapter] = [];
        }
        bibleIndex.versesByBookChapter[book][chapter].push(verseNumber);
    }

    Object.keys(bibleIndex.chaptersByBook).forEach(book => {
        bibleIndex.chaptersByBook[book] = Array.from(bibleIndex.chaptersByBook[book]).sort((a, b) => a - b);
    });
}

function initializeBrowseControls() {
    const bookSelect = document.getElementById("bookSelect");
    setOptions(bookSelect, bibleIndex.books, "책 선택");
    bookSelect.addEventListener("change", handleBookChange);
    document.getElementById("chapterSelect").addEventListener("change", handleChapterChange);
    document.getElementById("copyStartVerse").addEventListener("change", handleCopyStartChange);
    document.getElementById("copyEndVerse").addEventListener("change", handleCopyEndChange);

    if (bibleIndex.books.length > 0) {
        bookSelect.value = bibleIndex.books[0];
        handleBookChange();
    }
}

function setOptions(selectEl, values, placeholder, includeEmpty = false) {
    selectEl.innerHTML = "";

    if (includeEmpty) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = placeholder;
        selectEl.appendChild(option);
    }

    for (const value of values) {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = String(value);
        selectEl.appendChild(option);
    }

    if (!values.length && !includeEmpty) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = placeholder;
        selectEl.appendChild(option);
    }
}

function handleBookChange() {
    const book = document.getElementById("bookSelect").value;
    const chapters = bibleIndex.chaptersByBook[book] || [];
    const chapterSelect = document.getElementById("chapterSelect");

    setOptions(chapterSelect, chapters, "장 선택");

    if (chapters.length > 0) {
        chapterSelect.value = String(chapters[0]);
    }

    handleChapterChange();
}

function handleChapterChange() {
    const book = document.getElementById("bookSelect").value;
    const chapter = parseInt(document.getElementById("chapterSelect").value, 10);
    const verses = bibleIndex.versesByBookChapter[book]?.[chapter] || [];
    const verseSelect = document.getElementById("verseSelect");

    setOptions(verseSelect, verses, "전체 절", true);
    verseSelect.value = "";
}

function handleCopyStartChange(event) {
    copyRangeState.start = event.target.value;

    if (parseInt(copyRangeState.start, 10) > parseInt(copyRangeState.end, 10)) {
        copyRangeState.end = copyRangeState.start;
        document.getElementById("copyEndVerse").value = copyRangeState.end;
    }
}

function handleCopyEndChange(event) {
    copyRangeState.end = event.target.value;

    if (parseInt(copyRangeState.end, 10) < parseInt(copyRangeState.start, 10)) {
        copyRangeState.start = copyRangeState.end;
        document.getElementById("copyStartVerse").value = copyRangeState.start;
    }
}

function goHome() {
    if (!isDataLoaded) {
        return;
    }

    document.getElementById("searchInput").value = "";
    document.getElementById("resultList").innerHTML = "";
    removeLoadMoreBtn();

    currentResults = [];
    currentRenderCount = 0;
    currentSearchMeta = createHomeMeta();
    updateChapterNavButtons();
    updateChapterToolbar();

    const bookSelect = document.getElementById("bookSelect");
    if (bibleIndex.books.length > 0) {
        bookSelect.value = bibleIndex.books[0];
        handleBookChange();
    }

    setStatus(`데이터 로드 완료! (총 ${bibleData.length}절)`);
}

function browseBible() {
    if (!isDataLoaded) {
        return;
    }

    const book = document.getElementById("bookSelect").value;
    const chapter = parseInt(document.getElementById("chapterSelect").value, 10);
    const verseValue = document.getElementById("verseSelect").value;
    const verse = verseValue ? parseInt(verseValue, 10) : null;

    renderReference(book, chapter, verse);
}

function searchBible() {
    if (!isDataLoaded) {
        return;
    }

    const input = normalizeText(document.getElementById("searchInput").value);
    if (!input) {
        return;
    }

    const searchResult = performSearch(input);
    renderResults(searchResult.data, searchResult);
}

function performSearch(query) {
    const reference = parseReferenceQuery(query);
    if (reference) {
        return buildReferenceResult(reference.book, reference.chapter, reference.verse);
    }

    return {
        data: bibleData.filter(item => item.content.includes(query)),
        isReference: false,
        keyword: query,
        label: query
    };
}

function parseReferenceQuery(query) {
    const patterns = [
        /^([가-힣\s]+?)\s*(\d+)\s*장\s*(\d+)\s*절?$/,
        /^([가-힣\s]+?)\s*(\d+)\s*[:.]\s*(\d+)$/,
        /^([가-힣\s]+?)\s*(\d+)\s+(\d+)$/,
        /^([가-힣\s]+?)\s*(\d+)\s*장$/,
        /^([가-힣\s]+?)\s*(\d+)$/
    ];

    for (const pattern of patterns) {
        const match = query.match(pattern);
        if (!match) {
            continue;
        }

        const [, rawBook, chapterStr, verseStr] = match;
        const normalizedBook = normalizeBookName(rawBook);
        const book = BOOK_ALIASES[normalizedBook] || BOOK_ALIASES[normalizeText(rawBook)];

        if (!book) {
            continue;
        }

        const chapter = parseInt(chapterStr, 10);
        const verse = verseStr ? parseInt(verseStr, 10) : null;

        if (!bibleIndex.chaptersByBook[book]?.includes(chapter)) {
            return null;
        }

        if (verse !== null) {
            const verses = bibleIndex.versesByBookChapter[book]?.[chapter] || [];
            if (!verses.includes(verse)) {
                return null;
            }
        }

        syncBrowseSelection(book, chapter, verse);
        return { book, chapter, verse };
    }

    return null;
}

function syncBrowseSelection(book, chapter, verse) {
    const bookSelect = document.getElementById("bookSelect");
    const chapterSelect = document.getElementById("chapterSelect");
    const verseSelect = document.getElementById("verseSelect");

    bookSelect.value = book;
    handleBookChange();
    chapterSelect.value = String(chapter);
    handleChapterChange();
    verseSelect.value = verse === null ? "" : String(verse);
}

function buildReferenceResult(book, chapter, verse) {
    const data = bibleData.filter(item => {
        if (item.book !== book) {
            return false;
        }
        if (item.chapter !== chapter) {
            return false;
        }
        if (verse !== null && item.verse !== verse) {
            return false;
        }
        return true;
    });

    return {
        data,
        mode: "reference",
        isReference: true,
        keyword: "",
        label: verse === null ? `${book} ${chapter}장` : `${book} ${chapter}:${verse}`,
        book,
        chapter,
        verse,
        viewMode: verse === null ? "chapter" : "verse"
    };
}

function renderReference(book, chapter, verse) {
    syncBrowseSelection(book, chapter, verse);
    const referenceResult = buildReferenceResult(book, chapter, verse);
    renderResults(referenceResult.data, referenceResult);
}

function renderResults(results, meta) {
    currentResults = results;
    currentSearchMeta = meta;
    currentRenderCount = 0;
    updateChapterNavButtons();
    resetCopyRangeState();
    updateChapterToolbar();

    document.getElementById("resultList").innerHTML = "";
    removeLoadMoreBtn();

    if (results.length === 0) {
        setStatus("검색 결과가 없습니다.");
        return;
    }

    setStatus(`검색 결과: ${results.length}개`);

    if (meta.isReference) {
        renderBatch(results.length);
        return;
    }

    renderBatch(ITEMS_PER_PAGE);
}

function handleGlobalKeydown(event) {
    if (!isDataLoaded) {
        return;
    }

    const targetTag = event.target?.tagName;
    if (targetTag && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(targetTag)) {
        return;
    }

    if (event.key === "ArrowLeft") {
        navigateAdjacentChapter(-1);
    }

    if (event.key === "ArrowRight") {
        navigateAdjacentChapter(1);
    }
}

function navigateAdjacentChapter(direction) {
    const target = getAdjacentChapterTarget(direction);
    if (!target) {
        return;
    }

    renderReference(target.book, target.chapter, null);
}

function getAdjacentChapterTarget(direction) {
    if (currentSearchMeta.viewMode !== "chapter" || !currentSearchMeta.book || !currentSearchMeta.chapter) {
        return null;
    }

    const currentBookIndex = bibleIndex.books.indexOf(currentSearchMeta.book);
    const chapters = bibleIndex.chaptersByBook[currentSearchMeta.book] || [];
    const currentChapterIndex = chapters.indexOf(currentSearchMeta.chapter);

    if (direction < 0) {
        if (currentChapterIndex > 0) {
            return { book: currentSearchMeta.book, chapter: chapters[currentChapterIndex - 1] };
        }

        if (currentBookIndex > 0) {
            const book = bibleIndex.books[currentBookIndex - 1];
            const previousChapters = bibleIndex.chaptersByBook[book];
            return { book, chapter: previousChapters[previousChapters.length - 1] };
        }

        return null;
    }

    if (currentChapterIndex < chapters.length - 1) {
        return { book: currentSearchMeta.book, chapter: chapters[currentChapterIndex + 1] };
    }

    if (currentBookIndex < bibleIndex.books.length - 1) {
        const book = bibleIndex.books[currentBookIndex + 1];
        return { book, chapter: bibleIndex.chaptersByBook[book][0] };
    }

    return null;
}

function renderBatch(count) {
    const list = document.getElementById("resultList");
    const fragment = document.createDocumentFragment();
    const start = currentRenderCount;
    const end = Math.min(start + count, currentResults.length);

    for (let i = start; i < end; i += 1) {
        const item = currentResults[i];
        const li = document.createElement("li");
        li.className = currentSearchMeta.viewMode === "chapter" ? "result-item chapter-mode" : "result-item";

        const ref = document.createElement("span");
        ref.className = currentSearchMeta.viewMode === "chapter" ? "verse-number" : "verse-ref";
        ref.textContent = currentSearchMeta.viewMode === "chapter"
            ? `${item.verse}`
            : `${item.book}${item.chapter}:${item.verse}`;

        const content = document.createElement("span");
        content.className = "verse-content";

        if (currentSearchMeta.isReference || !currentSearchMeta.keyword) {
            content.textContent = item.content;
        } else {
            appendHighlightedText(content, item.content, currentSearchMeta.keyword);
        }

        li.appendChild(ref);
        li.appendChild(content);
        fragment.appendChild(li);
    }

    list.appendChild(fragment);
    currentRenderCount = end;
    updateLoadMoreButton();
}

function appendHighlightedText(container, text, keyword) {
    const parts = text.split(keyword);

    parts.forEach((part, index) => {
        if (part) {
            container.appendChild(document.createTextNode(part));
        }

        if (index < parts.length - 1) {
            const highlight = document.createElement("span");
            highlight.className = "highlight";
            highlight.textContent = keyword;
            container.appendChild(highlight);
        }
    });
}

function updateLoadMoreButton() {
    removeLoadMoreBtn();

    if (currentRenderCount >= currentResults.length) {
        return;
    }

    const list = document.getElementById("resultList");
    const btnContainer = document.createElement("div");
    btnContainer.id = "loadMoreContainer";
    btnContainer.style.textAlign = "center";
    btnContainer.style.marginTop = "20px";

    const btn = document.createElement("button");
    btn.textContent = "더 보기";
    btn.onclick = () => renderBatch(ITEMS_PER_PAGE);

    btnContainer.appendChild(btn);
    list.parentNode.insertBefore(btnContainer, list.nextSibling);
}

function removeLoadMoreBtn() {
    const existing = document.getElementById("loadMoreContainer");
    if (existing) {
        existing.remove();
    }
}

function resetCopyRangeState() {
    if (currentSearchMeta.viewMode !== "chapter" || currentResults.length === 0) {
        copyRangeState = { start: "", end: "" };
        return;
    }

    copyRangeState = {
        start: String(currentResults[0].verse),
        end: String(currentResults[currentResults.length - 1].verse)
    };
}

async function copySelectedRange() {
    if (currentSearchMeta.viewMode !== "chapter" || currentResults.length === 0) {
        return;
    }

    const startVerse = parseInt(document.getElementById("copyStartVerse").value, 10);
    const endVerse = parseInt(document.getElementById("copyEndVerse").value, 10);
    const selected = currentResults.filter(item => item.verse >= startVerse && item.verse <= endVerse);
    const text = selected.map(item => `${item.verse} ${item.content}`).join("\n");

    try {
        await copyPlainText(text);
        setStatus(`${currentSearchMeta.book} ${currentSearchMeta.chapter}장 ${startVerse}절-${endVerse}절이 복사되었습니다.`);
    } catch (error) {
        console.error(error);
        setStatus("복사에 실패했습니다. 브라우저 권한을 확인해주세요.", true);
    }
}

async function copyPlainText(text) {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (error) {
            console.warn("Clipboard API failed, trying fallback copy.", error);
        }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
        throw new Error("Fallback copy failed");
    }
}
