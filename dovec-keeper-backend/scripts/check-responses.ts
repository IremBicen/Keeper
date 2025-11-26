import mongoose from "mongoose";
import dotenv from "dotenv";
import ResponseModel from "../src/models/Response";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/dovec_keeper";

async function checkResponses() {
  console.log("🔍 Checking MongoDB Responses Collection...\n");
  console.log(`📡 Connection String: ${MONGO_URI}\n`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database Name: ${dbName}\n`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📁 Collections in database:");
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });
    console.log("");

    // Check responses collection using the model
    const responseCount = await ResponseModel.countDocuments();
    console.log(`📝 Responses Collection (using Model):`);
    console.log(`   Total Documents: ${responseCount}\n`);

    // Also check using direct collection access
    const directCollection = mongoose.connection.db.collection("responses");
    const directCount = await directCollection.countDocuments();
    console.log(`📝 Responses Collection (direct access):`);
    console.log(`   Total Documents: ${directCount}\n`);

    if (responseCount > 0) {
      console.log("   ✅ Found responses! Sample documents:\n");
      const samples = await ResponseModel.find().limit(3).lean();
      samples.forEach((doc: any, idx: number) => {
        console.log(`   Document ${idx + 1}:`);
        console.log(`   - _id: ${doc._id}`);
        console.log(`   - employee: ${doc.employee} (${typeof doc.employee})`);
        console.log(`   - survey: ${doc.survey} (${typeof doc.survey})`);
        console.log(`   - status: ${doc.status}`);
        console.log(`   - answers count: ${doc.answers?.length || 0}`);
        console.log(`   - submittedAt: ${doc.submittedAt || "N/A"}`);
        console.log("");
      });

      // Check submitted responses
      const submittedCount = await ResponseModel.countDocuments({ status: "submitted" });
      console.log(`   Submitted Responses: ${submittedCount}`);
    } else {
      console.log("   ⚠️  Collection is EMPTY!");
      console.log("   💡 This explains why Compass shows no data.");
      console.log("   💡 But the API might be reading from a different database.\n");
    }

    // Check what the API endpoint would see
    console.log("\n🔍 What /api/results would see:");
    const submittedResponses = await ResponseModel.find({ status: "submitted" })
      .populate("employee", "name email role department")
      .populate("survey", "title questions")
      .lean();
    
    console.log(`   Submitted responses: ${submittedResponses.length}`);
    if (submittedResponses.length > 0) {
      console.log("   Sample:");
      submittedResponses.slice(0, 2).forEach((r: any) => {
        const empName = r.employee?.name || r.employee?._id || "Unknown";
        const surveyTitle = r.survey?.title || r.survey?._id || "Unknown";
        console.log(`   - ${empName} → ${surveyTitle}`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n⚠️  MongoDB is not running!");
      console.error("   Start MongoDB service or check connection string.");
    }
    process.exit(1);
  }
}

checkResponses();

