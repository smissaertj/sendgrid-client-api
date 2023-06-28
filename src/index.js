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


    async function handlePost( name, email, message ) {


      let request = new Request( "https://api.sendgrid.com/v3/mail/send" );
      let response = await fetch( request, {
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
      let body;
      if( response?.ok === true ){
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

    function validateEmail( email ){
    // Regular expression pattern to validate email addresses
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
      return emailRegex.test( email );
    }

    if ( request.method === "OPTIONS" ) {
      // Handle CORS preflight requests
      return handleOptions( request );
    } else if (
      request.method === "POST"
    ) {
      // Handle requests to the API server
      if ( request.headers.get( "Js-Auth-Key" ) === env.JS_AUTH_KEY ){
        const { name, email, message } = await request.json();

        if( !name || !message || !email ){
          let body = { "success": false, "message": "Missing required fields" };
          return new Response( JSON.stringify( body ), {
            status: 400,
            statusText: "Bad Request",
            headers: corsHeaders,
          } );
        }

        if( !validateEmail( email ) ){
          let body = { "success": false, "message": "Invalid email address" };
          return new Response( JSON.stringify( body ), {
            status: 400,
            statusText: "Bad Request",
            headers: corsHeaders,
          } );
        }

        return handlePost( name, email, message );
      } else {
        let body = { "success": false, "message": "Unauthorized" };
        return new Response( JSON.stringify( body ), {
          status: 401,
          statusText: "Unauthorized",
          headers: corsHeaders,
        } );
      }
    } else {
      return new Response( null, {
        status: 405,
        statusText: "Method Not Allowed",
      } );
    }
  },
};