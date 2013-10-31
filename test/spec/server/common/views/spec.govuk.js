define([
  'common/views/govuk',
  'extensions/views/view',
  'extensions/models/model'
],
function (GovUkView, View, Model) {
  describe("GovUkView", function () {
    it("renders a page with a content view in GOV.UK style", function () {

      var TestView = View.extend({
        template: function () {
          return 'test_content';
        }
      });

      var model = new Model({
        requirePath: '/testRequirePath/',
        assetPath: '/testAssetPath/',
        environment: 'development'
      });

      var view = new GovUkView({
        model: model
      });

      spyOn(view, "template").andReturn('rendered')
      spyOn(view, "getContent").andReturn('test_content');

      view.render();

      expect(view.html).toEqual('rendered');

      var context = view.template.argsForCall[0][0];
      expect(context.head.trim()).toEqual('<link href="&#x2F;testAssetPath&#x2F;stylesheets/spotlight.css" media="screen" rel="stylesheet" type="text/css">');
      expect(context.bodyEnd.trim()).toEqual('<script data-main="&#x2F;testRequirePath&#x2F;client.js" src="&#x2F;testRequirePath&#x2F;vendor/require.js" type="text/javascript"></script>');

      var content = context.content.replace(/\s+/g, ' ').trim();
      expect(content).toEqual('<section id="content"> <div class="performance-platform-outer"> test_content </div> </section>');
    });
  });
});
