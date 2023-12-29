#include "CCImGuiLayer.h"
#include "imgui.h"
#include "imgui_impl_cocos2dx.h"
#include "CCIMGUI.h"
#include "PUB_String.h"
#include "qpxBaseLayer.h"

USING_NS_CC;

// on "init" you need to initialize your instance
bool ImGuiLayer::init() {
	//////////////////////////////
	// 1. super init first
	if (!Layer::init()) {
		return false;
	}

	// init imgui
	CCIMGUI::getInstance()->setWindow(((GLViewImpl*)Director::getInstance()->getOpenGLView())->getWindow());
	setGLProgram(GLProgramCache::getInstance()->getGLProgram(GLProgram::SHADER_NAME_POSITION_COLOR));

	// events
	auto listener = EventListenerTouchOneByOne::create();
	listener->setSwallowTouches(true);
	listener->onTouchBegan = [](Touch* touch, Event*) -> bool {
		bool inImGuiWidgets = ImGui::IsAnyWindowHovered();

		return inImGuiWidgets;
	};
	getEventDispatcher()->addEventListenerWithSceneGraphPriority(listener, this);
	return true;
}

void ImGuiLayer::visit(cocos2d::Renderer* renderer, const cocos2d::Mat4& parentTransform, uint32_t parentFlags) {
	Layer::visit(renderer, parentTransform, parentFlags);
	m_command.init(_globalZOrder);
	m_command.func = CC_CALLBACK_0(ImGuiLayer::onDraw, this);
	Director::getInstance()->getRenderer()->addCommand(&m_command);
}

void ImGuiLayer::onDraw() {
	getGLProgram()->use();

	if (CCIMGUI::getInstance()->getWindow()) {
		ImGuiIO& io = ImGui::GetIO();
		io.DeltaTime = Director::getInstance()->getDeltaTime();

		// create frame
		ImGui_ImplCocos2dx_NewFrame();
		renderHelpUI();
#ifdef USE_FGUI
		showFguiInspector();
#endif
		showCocosInspector();
		// draw all gui
		CCIMGUI::getInstance()->updateImGUI();
		// rendering
		glUseProgram(0);

		ImGui::Render();

		ImGui_ImplCocos2dx_RenderDrawData(ImGui::GetDrawData());
	}
}

void ImGuiLayer::renderHelpUI() {
	// ImGui::Begin("Hello, world!");
	//
	// ImGui::End();
}

void ImGuiLayer::showCocosInspector() {
	ImGui::SetNextWindowSize(ImVec2(400, 575), ImGuiCond_FirstUseEver);
	if (ImGui::Begin("CCInspector")) {
		ImGui::BeginChild("Node Tree", ImVec2(0, 250), true);
		showNodeTree(Director::getInstance()->getRunningScene());
		ImGui::EndChild();
		showNodeProperties();
	}
	ImGui::End();
}

void ImGuiLayer::showNodeTree(Node* node) {
	const string& desc = node->getDescription();
	auto tmp = desc.substr(1, desc.find(' '));
	// tmp = tmp.substr(0, tmp.length() - 1);
	string name = " [" + tmp + "]";
	size_t length = node->getName().length();
	if (length) {
		name.insert(0, node->getName());
	}

	if (node->getChildrenCount()) {
		bool is_okk = ImGui::TreeNodeEx(
			(void*)(intptr_t)node,
			ImGuiTreeNodeFlags_OpenOnArrow | ImGuiTreeNodeFlags_OpenOnDoubleClick | (m_nowSelectNode == node
					? ImGuiTreeNodeFlags_Selected
					: 0),
			name.c_str()
		);

		if (ImGui::IsItemClicked())
			m_nowSelectNode = node;

		if (is_okk) {
			auto children = node->getChildren();
			for (const auto child : children) {
				showNodeTree(child);
			}
			ImGui::TreePop();
		}
	}
	else {
		ImGui::TreeNodeEx(
			(void*)(intptr_t)node,
			ImGuiTreeNodeFlags_OpenOnArrow | ImGuiTreeNodeFlags_OpenOnDoubleClick | ImGuiTreeNodeFlags_Leaf |
			ImGuiTreeNodeFlags_NoTreePushOnOpen | (m_nowSelectNode == node ? ImGuiTreeNodeFlags_Selected : 0),
			name.c_str()
		);

		if (ImGui::IsItemClicked())
			m_nowSelectNode = node;
	}
}

void ImGuiLayer::showNodeProperties() {
	if (m_nowSelectNode) {
		Node* node = m_nowSelectNode;

		bool b_val = false;
		int order_tag = 0;
		float arr[4];

		if (ImGui::BeginTabBar("Node Properties", ImGuiTabBarFlags_None)) {
			if (ImGui::BeginTabItem("2D")) {
				arr[0] = node->getPositionX();
				arr[1] = node->getPositionY();
				if (ImGui::DragFloat2("Position", arr, 1.0f))
					node->setPosition(arr[0], arr[1]);

				arr[0] = node->getContentSize().width;
				arr[1] = node->getContentSize().height;
				if (ImGui::DragFloat2("Content Size", arr, 1.0f))
					node->setContentSize(Size(arr[0], arr[1]));

				arr[0] = node->getAnchorPoint().x;
				arr[1] = node->getAnchorPoint().y;
				if (ImGui::DragFloat2("Anchor Point", arr, 0.01f))
					node->setAnchorPoint(Vec2(arr[0], arr[1]));

				arr[0] = node->getScaleX();
				arr[1] = node->getScaleY();
				if (ImGui::DragFloat2("Scale", arr, 0.01f))
					node->setScale(arr[0], arr[1]);

				arr[0] = node->getRotation();
				if (ImGui::DragFloat("Rotation", arr, 1.0f))
					node->setRotation(arr[0]);

				arr[0] = node->getSkewX();
				arr[1] = node->getSkewY();
				if (ImGui::DragFloat2("Skew", arr, 0.1f)) {
					node->setSkewX(arr[0]);
					node->setSkewY(arr[1]);
				}

				order_tag = node->getTag();
				if (ImGui::DragInt("Tag", &order_tag))
					node->setTag(order_tag);

				order_tag = node->getLocalZOrder();
				if (ImGui::DragInt("Z Order", &order_tag))
					node->setLocalZOrder(order_tag);

				b_val = node->isVisible();
				if (ImGui::Checkbox("Visible", &b_val))
					node->setVisible(b_val);
				if (ImGui::Button("Show AABB")) {
					auto size = node->getContentSize();
					auto pos = node->convertToWorldSpace(node->getAnchorPoint());
					auto scene = Director::getInstance()->getRunningScene();
					auto draw_node = DrawNode::create();
					draw_node->drawSolidRect(
						Vec2::ZERO, Vec2(size.width * node->getScaleX(), size.height * node->getScaleY()),
						Color4F(1.0f, 0.f, 0.f, 0.4));
					draw_node->setPosition(pos);
					draw_node->runAction(Sequence::create(DelayTime::create(2.0f), FadeOut::create(0.3),
					                                      RemoveSelf::create(), nullptr));
					scene->addChild(draw_node, INT_MAX);
				}
				Color3B color = node->getColor();
				arr[0] = color.r / 255.0f;
				arr[1] = color.g / 255.0f;
				arr[2] = color.b / 255.0f;
				arr[3] = node->getOpacity() / 255.0f;
				if (ImGui::ColorEdit4("Color", arr)) {
					color.r = static_cast<GLubyte>(arr[0] * 255);
					color.g = static_cast<GLubyte>(arr[1] * 255);
					color.b = static_cast<GLubyte>(arr[2] * 255);
					node->setColor(color);
					node->setOpacity(static_cast<GLubyte>(arr[3] * 255));
				}

				b_val = node->isCascadeColorEnabled();
				if (ImGui::Checkbox("Cascade Color Enabled", &b_val))
					node->setCascadeColorEnabled(b_val);

				b_val = node->isCascadeOpacityEnabled();
				if (ImGui::Checkbox("Cascade Opacity Enabled", &b_val))
					node->setCascadeOpacityEnabled(b_val);

				b_val = node->isOpacityModifyRGB();
				if (ImGui::Checkbox("Is Opacity Modify RGB", &b_val))
					node->setOpacityModifyRGB(b_val);
				ImGui::EndTabItem();
			}
			ImGui::EndTabBar();
		}
	}
}
#ifdef USE_FGUI
void ImGuiLayer::showFguiInspector() {
	ImGui::SetNextWindowSize(ImVec2(400, 615), ImGuiCond_FirstUseEver);
	if (ImGui::Begin("FGUIInspector")) {
		ImGui::BeginChild("Object Tree", ImVec2(0, 250), true);
		auto childs = Director::getInstance()->getRunningScene()->getChildren();
		for (auto item : childs) {
			/*此处修改成自己的fguilayer基类*/
			/*在基类添加一个方法getGroot()返回Groot用来显示*/
			auto fuilayer = dynamic_cast<qpxBaseLayer*>(item);
			if (fuilayer) {
				if (GRoot* root = fuilayer->getGroot()) {
					showObjectTree(root);
				}
			}
		}
		ImGui::EndChild();

		showObjectProperties();
	}
	ImGui::End();
}

void ImGuiLayer::showObjectTree(fairygui::GObject* object) {
	GComponent* component = dynamic_cast<GComponent*>(object);
	std::string name = object->name;
	if (PackageItem* packageItem = object->getPackageItem()) {
		size_t length = packageItem->name.length();
		if (length) {
			if (name.empty()) {
				name.reserve(2 + length);
				name.append("[");
			}
			else {
				name.reserve(name.size() + 3 + length);
				name.append(" [");
			}

			name.append(packageItem->name);
			name.append("]");
		}
	}

	if (GRoot* root = object->as<GRoot>()) {
		if (name.empty()) {
			name = "[GROOT]";
		}
		else {
			const char postfix[] = " [GROOT]";
			name.reserve(name.size() + sizeof(postfix));
			name.append(postfix);
		}
	}

	if (component && component->numChildren() > 0) {
		bool ok = ImGui::TreeNodeEx(
			(void*)(intptr_t)object,
			ImGuiTreeNodeFlags_OpenOnArrow | ImGuiTreeNodeFlags_OpenOnDoubleClick | (m_nowSelectObj == object
					? ImGuiTreeNodeFlags_Selected
					: 0),
			name.c_str());

		if (ImGui::IsItemClicked())
			m_nowSelectObj = object;

		if (ok) {
			auto children = component->getChildren();
			for (GObject* child : children) {
				showObjectTree(child);
			}
			ImGui::TreePop();
		}
	}
	else {
		ImGui::TreeNodeEx(
			(void*)(intptr_t)object,
			ImGuiTreeNodeFlags_OpenOnArrow | ImGuiTreeNodeFlags_OpenOnDoubleClick | ImGuiTreeNodeFlags_Leaf |
			ImGuiTreeNodeFlags_NoTreePushOnOpen | (m_nowSelectObj == object ? ImGuiTreeNodeFlags_Selected : 0),
			name.c_str());

		if (ImGui::IsItemClicked())
			m_nowSelectObj = object;
	}
}

void ImGuiLayer::showObjectProperties() {
	if (m_nowSelectObj) {
		GObject* object = m_nowSelectObj;
		bool b_val = false;
		int order = 0;
		float arr[4];

		if (ImGui::BeginTabBar("Object Properties", ImGuiTabBarFlags_None)) {
			if (ImGui::BeginTabItem("Object")) {
				arr[0] = object->getX();
				arr[1] = object->getY();
				if (ImGui::DragFloat2("Position", arr, 1.0f))
					object->setPosition(arr[0], arr[1]);

				arr[0] = object->getWidth();
				arr[1] = object->getHeight();
				if (ImGui::DragFloat2("Size", arr, 1.0f))
					object->setSize(arr[0], arr[1]);

				arr[0] = object->getPivot().x;
				arr[1] = object->getPivot().y;
				if (ImGui::DragFloat2("Pivot", arr, 0.01f))
					object->setPivot(arr[0], arr[1], object->isPivotAsAnchor());

				b_val = object->isPivotAsAnchor();
				if (ImGui::Checkbox("Is Pivot As Anchor", &b_val)) {
					const cocos2d::Vec2& pivot = object->getPivot();
					object->setPivot(pivot.x, pivot.y, b_val);
				}

				arr[0] = object->getScaleX();
				arr[1] = object->getScaleY();
				if (ImGui::DragFloat2("Scale", arr, 0.01f))
					object->setScale(arr[0], arr[1]);

				arr[0] = object->getSkewX();
				arr[1] = object->getSkewY();
				if (ImGui::DragFloat2("Skew", arr, 0.01f)) {
					object->setSkewX(arr[0]);
					object->setSkewY(arr[1]);
				}

				arr[0] = object->getRotation();
				if (ImGui::DragFloat("Rotation", arr, 1.0f))
					object->setRotation(arr[0]);

				arr[0] = object->getAlpha();
				if (ImGui::DragFloat("Alpha", arr, 0.01f))
					object->setAlpha(arr[0]);

				order = object->getSortingOrder();
				if (ImGui::DragInt("SortingOrder", &order))
					object->setSortingOrder(order);

				b_val = object->isVisible();
				if (ImGui::Checkbox("Visible", &b_val))
					object->setVisible(b_val);

				b_val = object->isGrayed();
				if (ImGui::Checkbox("Grayed", &b_val))
					object->setGrayed(b_val);

				b_val = object->isTouchable();
				if (ImGui::Checkbox("Touchable", &b_val))
					object->setTouchable(b_val);
				if (ImGui::Button("Show AABB")) {
					auto size = object->getSize();
					auto scale = object->getScale();
					size = Size(scale.x * size.width, scale.y * size.height);
					auto an_pt = object->getPivot();
					auto pos = getFGUIPosition(object);
					if (object->isPivotAsAnchor()) {
						pos = Vec2(pos.x - size.width * an_pt.x, pos.y + size.height * an_pt.y);
					}
					auto scene = Director::getInstance()->getRunningScene();
					auto draw_node = DrawNode::create();
					draw_node->drawSolidRect(Vec2(-size.width / 2, -size.height / 2), size / 2,
					                         Color4F(1.0f, 0.f, 0.f, 0.4));
					draw_node->setPosition(pos);
					draw_node->runAction(Sequence::create(DelayTime::create(2.0f), FadeOut::create(0.3),
					                                      RemoveSelf::create(), nullptr));
					scene->addChild(draw_node, INT_MAX);
				}
				if (ImGui::DragInt("SortingOrder", &order))
					object->setSortingOrder(order);
				ImGui::EndTabItem();
			}

			ImGui::EndTabBar();
		}
	}
}

cocos2d::Vec2 ImGuiLayer::getFGUIPosition(fairygui::GObject* obj) {
	if (!obj) return Vec2::ZERO;

	auto _size = Director::getInstance()->getVisibleSize();
	auto size = obj->getSize();
	Vec2 pos = obj->localToGlobal(size / 2);

	return Vec2(pos.x, _size.height - pos.y);
}
#endif
