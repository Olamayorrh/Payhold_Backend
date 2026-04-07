import mongoose from "mongoose";
mongoose.connect("mongodb+srv://olamayorrh:mayowa@cluster1.aifcoso.mongodb.net/PayHold?retryWrites=true&w=majority").then(async () => {
    const db = mongoose.connection.db;
    const links = await db.collection("paymentlinks").find({}).toArray();
    console.log(JSON.stringify(links, null, 2));
    process.exit(0);
}).catch(console.error);
