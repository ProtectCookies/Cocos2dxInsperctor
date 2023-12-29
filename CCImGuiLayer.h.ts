#ifndef __IMGUILAYER_H__
#define __IMGUILAYER_H__

#define USE_FGUI // fgui��
//#define USE_IMGUI  // �Ƿ��imgui

#include "cocos2d.h"

#ifdef USE_FGUI
#include "FairyGUI.h"
USING_NS_FGUI;
#endif

USING_NS_CC;

class ImGuiLayer : public cocos2d::Layer
{
public:
    virtual bool init() override;

    virtual void visit(Renderer *renderer, const Mat4& parentTransform, uint32_t parentFlags) override;

    void onDraw();
    void renderHelpUI(); // ���ư���ҳ

    void showCocosInspector();// չʾcocosԭ���Ľڵ���
    void showNodeTree(Node* node); //չʾԭ���ڵ���
    void showNodeProperties();  // չʾԭ���ڵ�����

#ifdef USE_FGUI
	void showFguiInspector();                         // չʾfgui�Ľڵ���
    void showObjectTree(fairygui::GObject *object);   // չʾ�ڵ���
    void showObjectProperties();                      // չʾ�ڵ�����
    Vec2 getFGUIPosition(fairygui::GObject* obj); // fguiתcocos����
#endif
    CREATE_FUNC(ImGuiLayer);

private:
    CustomCommand m_command; // ��Ⱦָ��

    Node*   m_nowSelectNode = nullptr; // ��ǰѡ�еĽڵ�
#ifdef USE_FGUI
    GObject* m_nowSelectObj = nullptr; // ��ǰѡ�е�fgui�ڵ�
#endif
};

#endif // __IMGUILAYER_H__
