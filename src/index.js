export default {
  async fetch( request, env ) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Js-Auth-Key, Content-Type",
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Max-Age": "86400",
    };


    async function handlePost( request ) {
      const { name, email, message } = await request.json();
      let response = await fetch( "https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          // eslint-disable-next-line no-undef
          "Authorization": "Bearer " + env.SG_API_KEY,
          "Content-type": "application/json",
        },
        body: JSON.stringify( {
          personalizations: [
            {
              // eslint-disable-next-line no-undef
              to: [ { email: env.SG_TO_EMAIL } ],
            },
          ],
          from: {
            // eslint-disable-next-line no-undef
            email: env.SG_FROM_EMAIL,
            name: name,
          },
          reply_to: { email: email },
          subject: "Contact Form Submission from " + email,
          content: [
            {
              type: "text/plain",
              value: message,
            },
          ],
        } )
      } );
      console.log( response );
      return new Response( JSON.stringify( response ), {
        headers: corsHeaders,
      } );
    }

    async function handleOptions( request ) {
      if (
        request.headers.get( "Origin" ) !== null &&
        request.headers.get( "Access-Control-Request-Method" ) !== null &&
        request.headers.get( "Access-Control-Request-Headers" ) !== null
      ) {
        // Handle CORS preflight requests.
        return new Response( null, {
          headers: corsHeaders,
        } );
      } else {
        // Handle standard OPTIONS request.
        return new Response( null, {
          headers: {
            Allow: "POST, OPTIONS",
          },
        } );
      }
    }

    if ( request.method === "OPTIONS" ) {
      // Handle CORS preflight requests
      return handleOptions( request );
    } else if (
      request.method === "POST"
    ) {
      // Handle requests to the API server
      return handlePost( request );
    } else {
      return new Response( null, {
        status: 405,
        statusText: "Method Not Allowed",
      } );
    }
  },
};