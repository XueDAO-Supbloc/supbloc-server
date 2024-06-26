import https from "https";

const getPosts = () => {
  let data = '';

  const productID = "afkQgFCms7u6dZUIqR1P";
  const url = `https://neo4j-service-dot-connect-hackthon-2024.df.r.appspot.com/api/product?productId=${productID}`

  const request = https.get(url, (response) => {
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log(data);
    });
  });

  request.on('error', (error) => {
    console.error(error);
  });

  request.end();
};