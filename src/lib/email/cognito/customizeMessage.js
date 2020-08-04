import { fillTemplate } from '../utils/fillTemplate.js'

export async function customizeMessage(event) {
   let params

   switch(event.triggerSource) {
      case 'CustomMessage_SignUp':
         params = getSignUpMessageParams(event)
         break
      case 'CustomMessage_VerifyUserAttribute':
      case 'CustomMessage_UpdateUserAttribute':
         params = getUpdateUserAttributeParams(event)
         break
      case 'CustomMessage_ForgotPassword':
         params = getForgotPasswordParams(event)
         break
      default:
         return await event;
   }

   event.response.emailSubject = params.email.subject
   event.response.emailMessage = fillTemplate(params.email)

   return await event;
}

function getForgotPasswordParams(event) {
   const code_param = event.request.codeParameter
   const username = event.userName

   return {
      sms_message: `TS: Your password reset verification code is ${code_param}.`,
      email: {
         subject: `Your password reset verification code`,
         line1: `Hi ${username}!<br><br>Your password reset verification code is ${code_param}. Use the button below to reset your password!`,
         button: {
            href: `https://ts.city/reset_password?verification_code=${code_param}&username=${username}`,
            text: 'Reset Password',
         },
      }
   }
}

function getUpdateUserAttributeParams(event) {
   const code_param = event.request.codeParameter
   const username = event.userName

   return {
      sms_message: `Your TS verifcation code is ${code_param}.`,
      email: {
         subject: `Please verify your email address`,
         line1: `Hi ${username}!<br><br>Your TS verification code is ${code_param}.`
      }
   }
}

function getSignUpMessageParams(event) {
   const code_param = event.request.codeParameter
   const link_param = event.request.linkParameter

   const username = event.userName
   const email = event.request.userAttributes.email

   return {
      sms_message: `Your TS verification code is ${code_param}. Welcome back to TS, ${username}!`,
      email: {
         subject: `Please verify your email address`,
         line1: `Hi ${username}!<br><br>Welcome back to TS! Your TS verification code is ${code_param}. Enter it with your first login.`
      }
   }
}