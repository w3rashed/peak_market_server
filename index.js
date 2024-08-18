const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB code here

const { MongoClient, ServerApiVersion } = require("mongodb");

// const uri = `mongodb+srv://peakmarket:PmNza81MK5ZQHdHA@cluster0.nrpddgz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const uri = "mongodb://localhost:27017";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect(); // Ensure the client is connected

    const productCollection = client.db("peak-market").collection("products");

    app.get("/products", async (req, res) => {
      const {
        category,
        brand,
        minPrice,
        maxPrice,
        search,
        page = 1,
        limit = 10,
        sort,
      } = req.query;

      let filter = {};

      if (category) filter.category = category;
      if (brand) filter.brand = brand;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      if (search) filter.productName = { $regex: search, $options: "i" };

      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const skip = (pageNumber - 1) * pageSize;

      let sortOrder = {};
      if (sort === "priceLowToHigh") sortOrder.price = 1; // Ascending
      else if (sort === "priceHighToLow") sortOrder.price = -1; // Descending
      else if (sort === "newest") sortOrder.createdAt = -1; // Newest first
      else if (sort === "oldest") sortOrder.createdAt = 1; // Oldest first

      try {
        const products = await productCollection
          .find(filter)
          .skip(skip)
          .limit(pageSize)
          .sort(sortOrder)
          .toArray();

        const totalProducts = await productCollection.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / pageSize);

        res.status(200).json({
          products,
          totalProducts,
          totalPages,
          currentPage: pageNumber,
        });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("peak_market is running HERE!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
