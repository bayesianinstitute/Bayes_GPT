import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://tech:D02GdkTPAm6ULYpj@bayescluster.kzprmzi.mongodb.net/test?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

