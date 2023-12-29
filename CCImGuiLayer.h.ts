#ifndef __IMGUILAYER_H__
#define __IMGUILAYER_H__

#define USE_FGUI // fgui宏
//#define USE_IMGUI  // 是否打开imgui

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
    void renderHelpUI(); // 绘制帮助页

    void showCocosInspector();// 展示cocos原生的节点树
    void showNodeTree(Node* node); //展示原生节点树
    void showNodeProperties();  // 展示原生节点属性

#ifdef USE_FGUI
	void showFguiInspector();                         // 展示fgui的节点树
    void showObjectTree(fairygui::GObject *object);   // 展示节点树
    void showObjectProperties();                      // 展示节点属性
    Vec2 getFGUIPosition(fairygui::GObject* obj); // fgui转cocos坐标
#endif
    CREATE_FUNC(ImGuiLayer);

private:
    CustomCommand m_command; // 渲染指令

    Node*   m_nowSelectNode = nullptr; // 当前选中的节点
#ifdef USE_FGUI
    GObject* m_nowSelectObj = nullptr; // 当前选中的fgui节点
#endif
};

#endif // __IMGUILAYER_H__
