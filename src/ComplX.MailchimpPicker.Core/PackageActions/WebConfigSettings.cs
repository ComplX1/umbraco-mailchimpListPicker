using MailChimp.Net.Models;
using System;
using System.Configuration;
using System.Web.Configuration;
using System.Xml;
using umbraco.interfaces;
using Umbraco.Core.Logging;

namespace ComplX.MailchimpPicker.Core
{
    class AddApiKeyTemplate : IPackageAction
    {
        public string Alias() => "AddApiKeyTemplate";

        public bool Execute(string packageName, XmlNode xmlData)
        {
            try
            {
                Configuration webConfigApp = WebConfigurationManager.OpenWebConfiguration("~");
                if (webConfigApp.AppSettings.Settings[Constants.AppSettings.MailchimpApiKey] == null)
                {
                    webConfigApp.AppSettings.Settings.Add(Constants.AppSettings.MailchimpApiKey, "YOUR_API_KEY");
                    webConfigApp.Save();
                }
                LogHelper.Info(System.Reflection.MethodBase.GetCurrentMethod().GetType(), "ComplX Mailchimp Picker installed Successfully");
                return true;
            } catch(Exception e)
            {
                LogHelper.Info(System.Reflection.MethodBase.GetCurrentMethod().GetType(), "Error trying to Add WebConfig key:" + e.Message);
            }
            return false;
        }

        public XmlNode SampleXml()
        {
            const string sample = "<Action runat=\"install\" undo=\"true\" alias=\"AddApiKeyTemplate\"></Action>";
            return ParseStringToXmlNode(sample);
        }
        private static XmlNode ParseStringToXmlNode(string value)
        {
            var xmlDocument = new XmlDocument();
            var xmlNode = AddTextNode(xmlDocument, "error", "");

            try
            {
                xmlDocument.LoadXml(value);
                return xmlDocument.SelectSingleNode(".");
            }
            catch
            {
                return xmlNode;
            }
        }
        private static XmlNode AddTextNode(XmlDocument xmlDocument, string name, string value)
        {
            var node = xmlDocument.CreateNode(XmlNodeType.Element, name, "");
            node.AppendChild(xmlDocument.CreateTextNode(value));
            return node;
        }

        public bool Undo(string packageName, XmlNode xmlData)
        {
            return true;
        }
    }
}
