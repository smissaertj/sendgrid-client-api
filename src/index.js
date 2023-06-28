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

    function validateEmail( email ) {
      // Regular expression pattern to validate email addresses
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
      return emailRegex.test( email );
    }

    if ( request.method === "OPTIONS" ) {
      // Handle CORS preflight requests
      return handleOptions( request );
    } else if ( request.method === "POST" ) {
      // Handle requests to the API server
      const authKey = request.headers.get( "Js-Auth-Key" );

      if ( authKey !== env.JS_AUTH_KEY ) {
        return unauthorizedResponse();
      }

      const { name, email, message } = await request.json();

      if ( !name || !message || !email ) {
        return badRequestResponse( "Missing required fields" );
      }

      if ( !validateEmail( email ) ) {
        return badRequestResponse( "Invalid email address" );
      }

      return handlePost( name, email, message );
    } else {
      return methodNotAllowedResponse();
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

    async function handlePost( name, email, message ) {
      const request = new Request( "https://api.sendgrid.com/v3/mail/send" );
      const response = await fetch( request, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.SG_API_KEY,
          "Content-type": "application/json",
        },
        body: JSON.stringify( {
          personalizations: [
            {
              to: [ { email: env.SG_TO_EMAIL } ],
            },
          ],
          from: {
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
        } ),
      } );

      let body;
      if ( response.ok ) {
        body = { "success": true, "message": "Message sent successfully" };
      } else {
        console.error( response.status, response.statusText );
        body = { "success": false, "message": response.statusText };
      }

      return new Response( JSON.stringify( body ), {
        headers: corsHeaders,
        status: response.status,
      } );
    }

    function unauthorizedResponse() {
      const body = { "success": false, "message": "Unauthorized" };
      return new Response( JSON.stringify( body ), {
        status: 401,
        statusText: "Unauthorized",
        headers: corsHeaders,
      } );
    }

    function badRequestResponse( message ) {
      const body = { "success": false, "message": message };
      return new Response( JSON.stringify( body ), {
        status: 400,
        statusText: "Bad Request",
        headers: corsHeaders,
      } );
    }

    function methodNotAllowedResponse() {
      return new Response( null, {
        status: 405,
        statusText: "Method Not Allowed",
      } );
    }
  },
};
