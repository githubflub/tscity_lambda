import default_template from '../templates/email_template.html'

export function fillTemplate(params = {}, template = default_template) {
   let html = template;

   let line2 = params.line2 || '';
   if (!!params.button) {
      line2 += getButton()
         .replace(/\[Body_3\]/g, params.button.href || '')
         .replace(/\[Body_3_a\]/g, params.button.text || '')
   }

   html = html
      .replace(/\[BODY_1\]/g, params.line1 || '')
      .replace(/\[BODY_2\]/g, line2 || '')

   return html;
}

function getOtherButton() {
   return `<!-- Start Button -->
<table width="170" cellpadding="0" cellspacing="0" align="center" border="0" style="width: 170px;">
   <tr>
      <td width="170" height="46" bgcolor="#41A1A1" align="center" valign="middle" style="font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; line-height:18px; -webkit-border-radius: 50px; -moz-border-radius: 50px; border-radius: 50px; font-weight:bold;" mc:label="the_btnText" mc:edit="the_btnText">
         <a href="[Body_3]" target="_blank" alias="" style="font-family: Arial, sans-serif; text-decoration: none; color: #ffffff; height: 46px; padding-top:11px; box-sizing:border-box; display:block; text-align:center; border-radius:50px;">[Body_3_a]</a>
      </td>
   </tr>
</table>
<!-- End Button -->`
 }

function getButton() {
   const button = `<!-- Start Button -->
<div style="height: 40px; width:172px; margin-bottom:12px; background-color:#41A1A1; border: 1px solid #41A1A1; border-radius:4px;">
   <a href="[Body_3]" target="_blank" alias="" style="font-family: Arial, sans-serif; font-weight: 400; font-size: 18px; text-decoration: none; color: #ffffff; height: 43px; padding-top:8px; box-sizing:border-box; display:block; text-align:center; border-radius:4px;">
      <span style="display: inline-block; vertical-align: top; padding-top: 1px;">[Body_3_a]</span>
   </a>
</div>
<!-- End Button -->`

   return button;
}