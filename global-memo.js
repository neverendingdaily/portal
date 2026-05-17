// Firebaseのシステムを読み込む
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// あなたの鍵
const firebaseConfig = {
  apiKey: "AIzaSyCJwQooL2MHQq2fg8aeXWGDD2s8VfzKZ04",
  authDomain: "portal-app-25359.firebaseapp.com",
  projectId: "portal-app-25359",
  storageBucket: "portal-app-25359.firebasestorage.app",
  messagingSenderId: "148295764653",
  appId: "1:148295764653:web:fe588512833f88852a9424"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 【見張り番 兼 メモ起動機能】
onAuthStateChanged(auth, (user) => {
    // もし今いるページがトップページ（ログイン画面）なら、何もしない
    const isTopPage = window.location.pathname === "/portal/" || window.location.pathname === "/portal/index.html";
    
    if (!user) {
        // 未ログイン状態で、トップページ以外にいる場合は、強制的にトップへ追い出す！
        if (!isTopPage) {
            window.location.href = "https://neverendingdaily.github.io/portal/";
        }
    } else {
        // ログイン済みで、トップページ以外にいる場合は、メモ帳を出現させる！
        if (!isTopPage) {
            createMemoWidget(user);
        }
    }
});

// 【メモ帳UIを作る関数】
function createMemoWidget(user) {
    // 1. 画面にメモ帳の見た目（HTML/CSS）を直接注入する
    const widgetHTML = `
        <style>
            #cloud-memo-btn {
                position: fixed; bottom: 30px; right: 30px; z-index: 10000;
                background: #0369a1; color: white; border: none; border-radius: 50px;
                padding: 15px 25px; font-size: 16px; font-weight: bold; cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: all 0.2s;
            }
            #cloud-memo-btn:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.4); }
            
            #cloud-memo-panel {
                position: fixed; bottom: 90px; right: 30px; z-index: 10000;
                width: 320px; max-height: 500px; background: white; border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column;
                border: 1px solid #e2e8f0; font-family: sans-serif; overflow: hidden;
                transform: scale(0); transform-origin: bottom right; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            #cloud-memo-panel.active { transform: scale(1); }
            
            #cloud-memo-header {
                background: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0;
                font-weight: bold; color: #1e293b; display: flex; justify-content: space-between; align-items: center;
            }
            #close-memo-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; padding: 0; }
            #close-memo-btn:hover { color: #ef4444; }
            
            #cloud-memo-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
            #memo-textarea {
                width: 100%; height: 100px; padding: 12px; border: 1px solid #cbd5e1;
                border-radius: 8px; resize: none; box-sizing: border-box; font-size: 14px;
            }
            #memo-save-btn {
                background: #10b981; color: white; border: none; padding: 10px;
                border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s;
            }
            #memo-save-btn:hover { background: #059669; }
            
            #memo-list-container {
                overflow-y: auto; flex-grow: 1; padding: 0 16px 16px 16px; display: flex; flex-direction: column; gap: 8px;
            }
            .memo-item {
                background: #f1f5f9; padding: 12px; border-radius: 10px; font-size: 13px; color: #334155;
                position: relative; word-wrap: break-word; line-height: 1.5; border-left: 4px solid #3b82f6;
            }
            .memo-date { font-size: 11px; color: #64748b; margin-bottom: 6px; }
            .memo-delete-btn {
                position: absolute; top: 10px; right: 10px; background: #fee2e2; color: #ef4444;
                border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer;
            }
            .memo-delete-btn:hover { background: #fca5a5; color: white; }
        </style>

        <button id="cloud-memo-btn">📝 メモ・履歴</button>
        <div id="cloud-memo-panel">
            <div id="cloud-memo-header">
                <span>☁️ クラウドメモ帳</span>
                <button id="close-memo-btn">✖</button>
            </div>
            <div id="cloud-memo-body">
                <textarea id="memo-textarea" placeholder="アイデアや抽出したテキストを保存..."></textarea>
                <button id="memo-save-btn">保存する</button>
            </div>
            <div id="memo-list-container">
                </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // 2. ボタンの開閉アクション
    const btn = document.getElementById('cloud-memo-btn');
    const panel = document.getElementById('cloud-memo-panel');
    const closeBtn = document.getElementById('close-memo-btn');
    const saveBtn = document.getElementById('memo-save-btn');
    const textarea = document.getElementById('memo-textarea');
    const listContainer = document.getElementById('memo-list-container');

    btn.addEventListener('click', () => panel.classList.toggle('active'));
    closeBtn.addEventListener('click', () => panel.classList.remove('active'));

    // 3. 📝【保存ボタン】Firestoreに書き込む
    saveBtn.addEventListener('click', async () => {
        const text = textarea.value.trim();
        if (!text) return; // 空なら無視
        
        saveBtn.textContent = "保存中...";
        try {
            await addDoc(collection(db, "memos"), {
                userId: user.uid,
                content: text,
                createdAt: serverTimestamp() // クラウド上の正確な時間を記録
            });
            textarea.value = ''; // 保存できたら入力欄を空にする
        } catch (error) {
            console.error("保存エラー:", error);
            alert("保存に失敗しました");
        }
        saveBtn.textContent = "保存する";
    });

    // 4. 🔄【リアルタイム同期】Firestoreからメモ履歴を読み込む
    const q = query(collection(db, "memos"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    
    // onSnapshotは、クラウドに変更があるたびに自動で画面を更新してくれる魔法の関数
    onSnapshot(q, (snapshot) => {
        listContainer.innerHTML = ''; // リストを一旦空にする
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const memoId = docSnap.id; // クラウド上のデータのID（削除に必要）
            // 時間の表示を整える
            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleString('ja-JP', {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'たった今';
            
            // メモのブロックを作成
            const memoEl = document.createElement('div');
            memoEl.className = 'memo-item';
            memoEl.innerHTML = `
                <div class="memo-date">${dateStr}</div>
                <div style="white-space: pre-wrap;">${data.content}</div>
                <button class="memo-delete-btn" data-id="${memoId}">削除</button>
            `;
            listContainer.appendChild(memoEl);
        });

        // 🗑️【削除ボタン】の機能を設定
        document.querySelectorAll('.memo-delete-btn').forEach(delBtn => {
            delBtn.addEventListener('click', async (e) => {
                if (confirm("このメモを完全に削除しますか？")) {
                    const id = e.target.getAttribute('data-id');
                    await deleteDoc(doc(db, "memos", id)); // クラウドから消去！
                }
            });
        });
    });
}
