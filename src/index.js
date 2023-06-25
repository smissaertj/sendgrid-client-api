export default {
  async fetch( request, env ) {
    try {
      let body = null;
      const responseHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Js-Auth-Key, Content-Type",
        "Content-Type": "application/json;charset=UTF-8"
      };

      if( request.headers.get( "Js-Auth-Key" ) !== env.JS_AUTH_KEY ){
        body = { success: false, error: "Invalid API Key" };
        return new Response( JSON.stringify( body ), {
          status: 403,
          headers: responseHeaders
        } );
      }

      if ( request.method === "POST" ){
        const { name, email, message } = await request.json();

        if( !name || !email || !message ){
          body = { success: false, error: "Name, Email, and Message are required." };
        } else {
          await fetch( "https://api.sendgrid.com/v3/mail/send", {
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

        }

        // TODO - Check sendMail response code

        body = { success: true };
        return new Response( JSON.stringify( body ), {
          headers: responseHeaders
        } );
      } else {
        return new Response( "Not Found", {
          headers: responseHeaders,
          status: 404
        } );
      }
    } catch ( err ){
      console.log( err );
    }
  }
};
