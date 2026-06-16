import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDazsu-l1lmWYzqunKue5l9-guhszwW7Z0",
  authDomain: "al-aws.firebaseapp.com",
  projectId: "al-aws",
  storageBucket: "al-aws.firebasestorage.app",
  messagingSenderId: "778455390666",
  appId: "1:778455390666:web:a7f80a6e2effeeeb185733"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const colRef = collection(db, 'whitelist');
    const snapshot = await getDocs(colRef);
    console.log("Whitelist docs count:", snapshot.size);
    snapshot.forEach(doc => {
        console.log(doc.id, doc.data().name);
    });
  } catch(e) {
    console.error("FIREBASE ERROR:", e);
  }
}

test();
