# MirrorChat — MVP Starter (React Native + Firebase)

## What this repository contains

A single-file starter app (App.js) built with **Expo + React Native** that implements a minimal chat UI where the user "chats" with an AI-generated parallel self (mocked locally). The project includes:

- `App.js` — React Native + Expo app implementing chat UI.
- Firebase Realtime Database integration example (replace config placeholders).
- A placeholder for server-side AI responder (Cloud Function) using OpenAI — instructions included.
- README-style setup and run instructions.

---

## Quick Start (local)

1. Install Expo CLI:
```
npm install -g expo-cli
```

2. Create a new project and replace App.js with the code provided.
```
expo init MirrorChatMVP
cd MirrorChatMVP
# choose 'blank'
# replace App.js with the content below
expo start
```

3. Add Firebase SDK:
```
npm install firebase
```

4. Configure Firebase Realtime Database and Authentication. Copy your Firebase config and paste into `FIREBASE_CONFIG` in App.js.

5. (Optional) Set up an OpenAI Cloud Function to generate "mirror" responses. See section "Server (AI responder)" below.

---

## App.js (single-file starter)

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, I18nManager } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  databaseURL: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const db = firebase.database();

export default function App() {
  const [userId, setUserId] = useState('user_' + Math.floor(Math.random()*1000000));
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current = db.ref('chats/' + userId);
    chatRef.current.limitToLast(50).on('value', snapshot => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
      setMessages(list.sort((a,b) => a.timestamp - b.timestamp));
    });
    return () => { if (chatRef.current) chatRef.current.off(); };
  }, []);

  const sendMessage = async (content, role='user') => {
    if (!content) return;
    const msg = { role, content, timestamp: Date.now() };
    await chatRef.current.push(msg);

    if (role === 'user') {
      const mirrorReply = generateMirrorReply(content);
      setTimeout(() => {
        chatRef.current.push({ role: 'mirror', content: mirrorReply, timestamp: Date.now() });
      }, 1200);
    }
  };

  const generateMirrorReply = (input) => {
    if (!input) return '...';
    if (/leave|quit|stop|resign/i.test(input)) return 'Mirror: هل أنت متأكد؟ ماذا لو غيرت فقط طريقة التجربة؟';
    if (/happy|love|great|good|wonderful/i.test(input)) return 'Mirror: هذا جميل — استمتع بكل لحظة من نجاحك.';
    if (/sad|lonely|tired|depress/i.test(input)) return 'Mirror: أحزنني هذا. تذكر أن الألم مؤقت وربما تجربة جديدة قادمة.';
    return `Mirror: سمعتك تقول \"${input}\" — لكن ما الذي كنت تقصده بقلبك؟`;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.msg, item.role === 'user' ? styles.userMsg : styles.mirrorMsg]}>
      <Text style={styles.msgText}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerText}>MirrorChat — مراسلتك الموازية</Text></View>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        inverted
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="اكتب لنسختك الموازية..."
            style={styles.input}
            multiline
            textAlign='right'
          />
          <TouchableOpacity onPress={() => { if (text.trim()) { sendMessage(text.trim()); setText(''); } }} style={styles.sendBtn}>
            <Text style={{ color: '#fff' }}>أرسل</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { padding: 12, backgroundColor: '#2b2b2b' },
  headerText: { color: '#fff', fontSize: 18, textAlign: 'center' },
  composer: { flexDirection: 'row-reverse', padding: 8, borderTopWidth: 1, borderColor: '#eee', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  sendBtn: { marginLeft: 8, backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18 },
  msg: { marginVertical: 6, padding: 10, borderRadius: 10, maxWidth: '85%' },
  userMsg: { backgroundColor: '#e6f0ff', alignSelf: 'flex-end' },
  mirrorMsg: { backgroundColor: '#fff7e6', alignSelf: 'flex-start' },
  msgText: { fontSize: 15 }
});
```

---

## Server (AI responder) — recommended production flow

1. Create a small Cloud Function (Node.js) or server endpoint that accepts user message and `userId`.
2. The function calls OpenAI/GPT with a prompt instructing it to respond as the user's "mirror" persona.
3. Push the generated reply into Firebase Realtime Database under `chats/{userId}` so the client receives it.

> Never call OpenAI from client-side — keep your API key on the server.

---

## Next steps & features to add
- Authentication (phone number / OTP) and persistent user profiles
- Fine-tune AI persona using user's previous messages
- Voice recording + voice cloning (optional, paywalled)
- Customizable "mirror" personalities
- Group "mirror rooms" and shared parallel conversations
- Moderation and safety filters
