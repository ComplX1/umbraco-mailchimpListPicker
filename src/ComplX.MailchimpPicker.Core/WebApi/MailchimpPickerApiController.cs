using MailChimp.Net;
using MailChimp.Net.Interfaces;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Results;
using Umbraco.Core.Logging;
using Umbraco.Web.Editors;

namespace ComplX.MailchimpPicker.Core
{
    /// <summary>
    /// The MailchimpPicker api controller.
    /// </summary>
    public class MailchimpPickerApiController : UmbracoAuthorizedJsonController
    {
        private readonly IMailChimpManager mailChimpManager;

        public MailchimpPickerApiController()
        {
            mailChimpManager = new MailChimpManager(ConfigurationManager.AppSettings[Constants.AppSettings.MailchimpApiKey]);
        }

        public MailchimpPickerApiController(IMailChimpManager mailChimpManager)
        {
            this.mailChimpManager = mailChimpManager;
        }

        /// <summary>
        /// Gets incoming links for a document
        /// </summary>
        public JsonResult<IEnumerable<MailchimpList>> GetMailchimpLists()
        {
            try
            {
                var MailchimpLists = mailChimpManager.Lists.GetAllAsync().Result;

                var Lists = MailchimpLists.OrderByDescending(l => l.DateCreated).Select(l => new MailchimpList()
                {
                    ID = l.Id,
                    Name = l.Name
                });

                return Json(Lists, new Newtonsoft.Json.JsonSerializerSettings() { ContractResolver = new CamelCasePropertyNamesContractResolver() });
            }
            catch(Exception e)
            {
                LogHelper.Error(System.Reflection.MethodBase.GetCurrentMethod().GetType(), "Error trying to Add WebConfig key:" + e.Message, e);
                throw new HttpResponseException(new HttpResponseMessage() { StatusCode = HttpStatusCode.Forbidden, ReasonPhrase = "Mailchimp Api Key not valid - Please check your Web.config value" });
            }
        }

        /// <summary>
        /// Gets incoming links for a document
        /// </summary>
        public JsonResult<MailchimpList> GetMailchimpList(string id)
        {
            var MailchimpList = mailChimpManager.Lists.GetAsync(id).Result;

            var List = new MailchimpList()
            {
                ID = MailchimpList.Id
              , Name = MailchimpList.Name
            };

            return Json(List, new Newtonsoft.Json.JsonSerializerSettings() { ContractResolver = new CamelCasePropertyNamesContractResolver() });
        }
    }
}
